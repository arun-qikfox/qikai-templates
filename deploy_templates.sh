#!/bin/bash

set -euo pipefail

# Determine Python executable (prefer python3, fall back to python)
if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD="python"
else
  echo "❌ python3/python not found. Please install Python."
  exit 1
fi

# Determine Pip executable (prefer pip3, fall back to pip or python -m pip)
if command -v pip3 >/dev/null 2>&1; then
  PIP_CMD="pip3"
elif command -v pip >/dev/null 2>&1; then
  PIP_CMD="pip"
else
  PIP_CMD="$PYTHON_CMD -m pip"
fi

echo "🚀 Starting template deployment process..."

# Ensure PyYAML is installed
echo "🐍 Checking Python dependencies..."
if ! $PYTHON_CMD -c "import yaml" 2>/dev/null; then
    echo "📦 Installing PyYAML..."
    if ! $PIP_CMD install pyyaml; then
        echo "❌ Failed to install PyYAML. Please install it manually: pip install pyyaml"
        exit 1
    fi
    echo "✅ PyYAML installed successfully"
else
    echo "✅ PyYAML is already installed"
fi

# 1) Generate templates into build/
echo "🧱 Generating templates into build/..."
$PYTHON_CMD tools/generate_templates.py --clean
echo "✅ Templates generated"

# 2) Generate template catalog (generate_template_catalog.py now defaults to ./build)
echo "📋 Generating template catalog..."
$PYTHON_CMD generate_template_catalog.py --output template_catalog.json --pretty
echo "✅ Generated template catalog"

# Create optimized zip files for templates
echo "📦 Creating optimized zip files for templates..."

# Create zips directory
mkdir -p zips

# Function to create fast-extracting zip files using Python
create_template_zip() {
  local template_dir="$1"
  local template_name=$(basename "$template_dir")
  local zip_file="zips/${template_name}.zip"
  
  echo "Creating zip for: $template_name"
  
  # Use Python script to create zip (compatible with environments without zip command)
  if $PYTHON_CMD create_zip.py "$template_dir" "$zip_file"; then
    # Verify the zip file was created
    if [ -f "$zip_file" ]; then
      local size=$(du -h "$zip_file" | cut -f1)
      echo "✅ Created $zip_file ($size)"
    else
      echo "❌ Failed to create $zip_file"
      return 1
    fi
  else
    echo "❌ Failed to create $zip_file using Python"
    return 1
  fi
}

# 3) Create zip for each valid template directory in build/ in parallel
pids=()
for dir in build/*/; do
  # Skip non-directories and hidden directories
  if [[ ! -d "$dir" || "$dir" == .* ]]; then
    continue
  fi
  
  dir_name=$(basename "$dir")

  # Exclude deprecated template families from deploy packaging
  if [[ "$dir_name" == next-gcp-* || "$dir_name" == vite-cf-DO-*-gcp || "$dir_name" == vite-cf-do-*-gcp ]]; then
    echo "⏭️  Skipping excluded template: $dir_name"
    continue
  fi
  
  # Skip non-template directories if any appear
  if [[ "$dir_name" == ".git" || "$dir_name" == "node_modules" || "$dir_name" == ".github" ]]; then
    continue
  fi
  
  has_workers_config=false
  [[ -f "$dir/wrangler.jsonc" || -f "$dir/wrangler.toml" ]] && has_workers_config=true
  has_gcp_config=false
  # GCP templates require both app.yaml and .gcloudignore (matching catalog generator logic)
  if [[ -f "$dir/app.yaml" && -f "$dir/.gcloudignore" ]]; then
    has_gcp_config=true
  fi
  
  # Check for all required template files
  has_package_json=false
  has_prompts_dir=false
  has_selection_md=false
  has_usage_md=false
  
  [[ -f "$dir/package.json" ]] && has_package_json=true
  [[ -d "$dir/prompts" ]] && has_prompts_dir=true
  [[ -f "$dir/prompts/selection.md" ]] && has_selection_md=true
  [[ -f "$dir/prompts/usage.md" ]] && has_usage_md=true
  
  if [[ "$has_package_json" = true && "$has_prompts_dir" = true && "$has_selection_md" = true && "$has_usage_md" = true && ( "$has_workers_config" = true || "$has_gcp_config" = true ) ]]; then
    if [[ "$has_workers_config" = true && "$has_gcp_config" = true ]]; then
      echo "📦 $dir_name has both Cloudflare and GCP configs; zipping once"
    elif [[ "$has_workers_config" = true ]]; then
      echo "📦 $dir_name detected as Cloudflare template"
    else
      echo "📦 $dir_name detected as GCP template"
    fi
    create_template_zip "$dir" &
    pids+=($!)
  else
    echo "⏭️  Skipping $dir_name"
    echo "   Reasons:"
    [[ "$has_package_json" != true ]] && echo "   - Missing package.json"
    [[ "$has_prompts_dir" != true ]] && echo "   - Missing prompts/ directory"
    [[ "$has_selection_md" != true ]] && echo "   - Missing prompts/selection.md"
    [[ "$has_usage_md" != true ]] && echo "   - Missing prompts/usage.md"
    [[ "$has_workers_config" != true && "$has_gcp_config" != true ]] && echo "   - Missing platform config (needs wrangler.jsonc/wrangler.toml OR app.yaml+.gcloudignore)"
  fi
done

# Wait for all zip creation processes to complete
echo "⏳ Waiting for all zip creation processes to complete..."
for pid in "${pids[@]}"; do
  wait "$pid"
done

echo "📦 All template zips created successfully"
ls -la zips/

# Verify Wrangler CLI is available
echo "⚙️  Verifying Wrangler CLI..."
wrangler --version
echo "✅ Wrangler CLI ready"

# Determine R2 endpoint based on LOCAL_R2 environment variable
if [ "${LOCAL_R2:-}" = "true" ]; then
  echo "🏠 LOCAL_R2=true - using local R2 endpoint"
  R2_FLAGS="--local"
  R2_ENDPOINT="local R2"
else
  echo "☁️  Using remote Cloudflare R2"
  R2_FLAGS="--remote"
  R2_ENDPOINT="Cloudflare R2"
fi

# Upload files to R2
echo "🚀 Uploading files to $R2_ENDPOINT..."

# Function to upload a file to R2
upload_to_r2() {
  local file_path="$1"
  local r2_key="$2"
  local description="$3"
  
  echo "Uploading: $description"
  if wrangler r2 object put "${R2_BUCKET_NAME}/$r2_key" --file="$file_path" $R2_FLAGS; then
    echo "✅ Successfully uploaded $description"
    return 0
  else
    echo "❌ Failed to upload $description"
    return 1
  fi
}

# Upload template catalog JSON and all zip files
if [ "${LOCAL_R2:-}" = "true" ]; then
  echo "📄📦 Uploading template catalog and zip files sequentially (local R2)..."
  failed_uploads=()

  # Upload catalog first
  if ! upload_to_r2 "template_catalog.json" "template_catalog.json" "template_catalog.json"; then
    failed_uploads+=("template_catalog.json upload failed")
  fi

  # Upload zip files sequentially
  for zip_file in zips/*.zip; do
    if [ -f "$zip_file" ]; then
      filename=$(basename "$zip_file")
      if ! upload_to_r2 "$zip_file" "$filename" "$filename"; then
        failed_uploads+=("$filename upload failed")
      fi
    fi
  done
else
  echo "📄📦 Uploading template catalog and zip files in parallel..."
  upload_pids=()
  failed_uploads=()

  # Start catalog upload in background
  upload_to_r2 "template_catalog.json" "template_catalog.json" "template_catalog.json" &
  upload_pids+=($!)

  # Start zip file uploads in background
  for zip_file in zips/*.zip; do
    if [ -f "$zip_file" ]; then
      filename=$(basename "$zip_file")
      upload_to_r2 "$zip_file" "$filename" "$filename" &
      upload_pids+=($!)
    fi
  done

  # Wait for all uploads to complete and check for failures
  echo "⏳ Waiting for all uploads to complete..."
  for pid in "${upload_pids[@]}"; do
    if ! wait "$pid"; then
      failed_uploads+=("Upload process $pid failed")
    fi
  done
fi

# Check if any uploads failed
if [ ${#failed_uploads[@]} -gt 0 ]; then
  echo "❌ Some uploads failed:"
  for failure in "${failed_uploads[@]}"; do
    echo "  - $failure"
  done
  exit 1
fi

echo "🎉 All files uploaded successfully to $R2_ENDPOINT bucket: ${R2_BUCKET_NAME}"

# Skip verification as wrangler doesn't have a list command
echo "✅ All uploads completed successfully"

# Generate deployment summary for GitHub Actions
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "## 🚀 Deployment Summary" >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "### 📋 Template Catalog" >> $GITHUB_STEP_SUMMARY
  echo "- ✅ Generated and uploaded \`template_catalog.json\`" >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "### 📦 Template Archives" >> $GITHUB_STEP_SUMMARY
  
  # Count and list zip files
  zip_count=$(ls zips/*.zip 2>/dev/null | wc -l)
  echo "- ✅ Created and uploaded $zip_count template zip files:" >> $GITHUB_STEP_SUMMARY
  
  for zip_file in zips/*.zip; do
    if [ -f "$zip_file" ]; then
      filename=$(basename "$zip_file" .zip)
      size=$(du -h "$zip_file" | cut -f1)
      echo "  - \`$filename\` ($size)" >> $GITHUB_STEP_SUMMARY
    fi
  done
  
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "### 🌐 Access URLs" >> $GITHUB_STEP_SUMMARY
  if [ "${LOCAL_R2:-}" = "true" ]; then
    echo "- **Target**: Local R2 (${R2_BUCKET_NAME})" >> $GITHUB_STEP_SUMMARY
    echo "- **Note**: Files uploaded to local R2 development environment" >> $GITHUB_STEP_SUMMARY
  else
    echo "- **Catalog**: \`https://${R2_BUCKET_NAME}.r2.dev/template_catalog.json\`" >> $GITHUB_STEP_SUMMARY
    echo "- **Templates**: \`https://${R2_BUCKET_NAME}.r2.dev/[template-name].zip\`" >> $GITHUB_STEP_SUMMARY
  fi
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "🕐 **Deployed at**: $(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)" >> $GITHUB_STEP_SUMMARY
fi

echo "🎯 Template deployment completed successfully!"
