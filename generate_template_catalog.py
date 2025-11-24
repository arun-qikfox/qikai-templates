#!/usr/bin/env python3
"""
Template Catalog Generator

Scans directories to identify valid Cloudflare templates and generates a JSON catalog.
A valid template must have:
- wrangler.jsonc or wrangler.toml
- package.json 
- prompts/ directory with selection.md and usage.md files
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse


TEMPLATES_ROOT = Path(__file__).resolve().parent
DEFINITIONS_DIR = TEMPLATES_ROOT / "definitions"
VALID_DEPLOYMENT_TYPES = {"client-only", "full-stack", "platform-specific"}
VALID_PROVIDERS = {"cloudflare", "gcp"}


class Colors:
    """ANSI color codes for terminal output"""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


def log_info(message: str) -> None:
    """Log info message to stderr"""
    print(f"{Colors.GREEN}[INFO]{Colors.NC} {message}", file=sys.stderr)


def log_warn(message: str) -> None:
    """Log warning message to stderr"""
    print(f"{Colors.YELLOW}[WARN]{Colors.NC} {message}", file=sys.stderr)


def log_error(message: str) -> None:
    """Log error message to stderr"""
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}", file=sys.stderr)


class MetadataError(Exception):
    """Raised when template metadata is missing or invalid"""
    pass


def load_template_metadata(template_name: str) -> Dict[str, Any]:
    """
    Load the metadata.json file for a template definition.
    """
    metadata_path = DEFINITIONS_DIR / template_name / "metadata.json"
    if not metadata_path.exists():
        raise MetadataError(f"Metadata file missing for template '{template_name}'. Expected at: {metadata_path}")
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        raise MetadataError(f"Unable to parse metadata for '{template_name}': {exc}") from exc

    supported_providers = metadata.get("supportedProviders")
    deployment_type = metadata.get("deploymentType")

    if not isinstance(supported_providers, list) or not supported_providers:
        raise MetadataError(f"'supportedProviders' must be a non-empty list for template '{template_name}'")

    normalized_providers = []
    for provider in supported_providers:
        if provider not in VALID_PROVIDERS:
            raise MetadataError(
                f"Template '{template_name}' has invalid provider '{provider}'. "
                f"Valid providers: {sorted(VALID_PROVIDERS)}"
            )
        normalized_providers.append(provider)

    if deployment_type not in VALID_DEPLOYMENT_TYPES:
        raise MetadataError(
            f"Template '{template_name}' must specify a valid deploymentType ({sorted(VALID_DEPLOYMENT_TYPES)}). "
            f"Found: {deployment_type!r}"
        )

    return {
        "supportedProviders": normalized_providers,
        "deploymentType": deployment_type,
    }


def get_template_platform(template_dir: Path) -> Optional[str]:
    """
    Determine the platform a template targets.
    
    Args:
        template_dir: Path to the directory to check
        
    Returns:
        'cloudflare', 'gcp', or None
    """
    has_package = (template_dir / "package.json").exists()
    has_prompts = (template_dir / "prompts").is_dir()
    has_selection = (template_dir / "prompts" / "selection.md").exists()
    has_usage = (template_dir / "prompts" / "usage.md").exists()
    
    if not (has_package and has_prompts and has_selection and has_usage):
        return None
    
    has_workers_config = (template_dir / "wrangler.jsonc").exists() or (template_dir / "wrangler.toml").exists()
    has_gcp_config = (template_dir / "app.yaml").exists() and (template_dir / ".gcloudignore").exists()
    
    if has_workers_config:
        return "cloudflare"
    if has_gcp_config:
        return "gcp"
    return None


def extract_frameworks(package_json_path: Path) -> List[str]:
    """
    Extract frameworks from package.json dependencies.
    
    Args:
        package_json_path: Path to package.json file
        
    Returns:
        List of detected frameworks
    """
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        log_warn(f"Could not parse {package_json_path}: {e}")
        return []
    
    # Get all dependencies
    dependencies = package_data.get('dependencies', {})
    dev_dependencies = package_data.get('devDependencies', {})
    all_deps = list(dependencies.keys()) + list(dev_dependencies.keys())
    
    # Framework detection patterns
    framework_patterns = [
        # Frontend Frameworks
        "react", "next", "vue", "angular", "svelte", "nuxt", "astro", "remix", 
        "solid-js", "preact", "lit", "stencil",
        
        # Backend Frameworks
        "express", "fastify", "koa", "hono",
        
        # Build Tools & Bundlers
        "vite", "webpack", "rollup", "parcel", "swc", "critters",
        
        # Cloudflare Services
        "cloudflare", "workers", "wrangler", "durable-objects", "d1", "r2", 
        "kv", "queues", "agents", "vectorize", "hyperdrive", "analytics",
        "@cloudflare/workers-types", "@cloudflare/vite-plugin", "@opennextjs/cloudflare",
        
        # UI Libraries & Component Systems
        "tailwind", "bootstrap", "material-ui", "@mui", "antd", "chakra-ui", 
        "@radix-ui", "@headlessui", "shadcn", "@dnd-kit", "lucide-react",
        
        # Styling & Animation
        "styled-components", "emotion", "sass", "less", "stylus", "framer-motion",
        "tailwind-merge", "tailwindcss-animate", "class-variance-authority",
        "tw-animate-css",
        
        # State Management
        "redux", "zustand", "mobx", "recoil", "jotai", "valtio", "immer",
        "@tanstack/react-query", "swr", "apollo", "relay",
        
        # Form Handling & Validation
        "formik", "react-hook-form", "@hookform/resolvers", "zod", "yup", "joi",
        
        # Routing
        "react-router", "react-router-dom", "@reach/router", "next/router",
        
        # Authentication
        "next-auth", "auth0", "passport", "supabase", "firebase", "clerk",
        
        # Database & ORM
        "prisma", "drizzle", "mongoose", "sequelize", "typeorm", "knex",
        
        # GraphQL
        "apollo", "graphql", "relay", "@apollo/client", "urql",
        
        # tRPC
        "trpc", "@trpc/client", "@trpc/server", "@trpc/react-query",
        
        # AI & Machine Learning
        "openai", "langchain", "@ai-sdk", "vercel/ai", "anthropic", "cohere",
        "@modelcontextprotocol", "mcp-client", "mcp-remote", "agents",
        
        # Real-time Communication
        "socket.io", "pusher", "ably", "supabase-realtime",
        
        # Data Visualization
        "d3", "chart.js", "recharts", "victory", "nivo", "plotly", "observable",
        "react-flow", "embla-carousel",
        
        # Maps & Geolocation
        "leaflet", "mapbox", "google-maps",
        
        # Utilities
        "lodash", "ramda", "date-fns", "moment", "dayjs", "luxon", "clsx", "classnames",
        "axios", "fetch", "ky", "got", "node-fetch",
        
        # Development Tools (excluding linting which are dev-only)
        "typescript", "babel", "postcss", "autoprefixer",
        
        # Testing Frameworks
        "jest", "vitest", "cypress", "playwright", "testing-library", "mocha", "jasmine",
        
        # Storybook
        "storybook", "@storybook",
        
        # Security & Crypto
        "jsonwebtoken", "bcrypt", "helmet", "cors", "crypto-js",
        
        # Email & Notifications
        "nodemailer", "sendgrid", "mailgun", "resend",
        
        # Storage & File Handling
        "multer", "sharp", "jimp", "canvas",
        
        # Deployment & DevOps
        "docker", "kubernetes", "terraform", "serverless",
        
        # Monitoring & Analytics
        "sentry", "datadog", "newrelic", "mixpanel", "amplitude",
        
        # UI Specific Components
        "react-select", "react-day-picker", "react-resizable-panels", "react-hotkeys-hook",
        "sonner", "vaul", "input-otp", "cmdk", "react-virtualized", "react-window",
        
        # Themes & Styling Systems
        "next-themes", "@next/themes", "theme-ui",
        
        # Concurrency & Process Management
        "concurrently", "pm2", "nodemon"
    ]
    
    # Find matching frameworks
    detected_frameworks = []
    for dep in all_deps:
        for pattern in framework_patterns:
            if pattern in dep.lower():
                if pattern not in detected_frameworks:
                    detected_frameworks.append(pattern)
                break
    
    return sorted(detected_frameworks)


def read_file_content(file_path: Path) -> str:
    """
    Read file content safely, handling encoding issues.
    
    Args:
        file_path: Path to the file to read
        
    Returns:
        File content as string, empty string if file doesn't exist or can't be read
    """
    if not file_path.exists():
        return ""
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        # Normalize line endings and clean up control characters
        content = content.replace('\r\n', '\n').replace('\r', '\n')
        # Remove problematic control characters but keep newlines and tabs
        content = ''.join(char if ord(char) >= 32 or char in '\n\t' else ' ' for char in content)
        
        return content.strip()
    except Exception as e:
        log_warn(f"Could not read {file_path}: {e}")
        return ""


def process_template(template_dir: Path, platform: str) -> Dict[str, Any]:
    """
    Process a single template directory and extract its information.
    
    Args:
        template_dir: Path to the template directory
        
    Returns:
        Dictionary containing template information
    """
    template_name = template_dir.name
    log_info(f"Processing template: {template_name}")
    
    # Extract frameworks from package.json
    frameworks = extract_frameworks(template_dir / "package.json")
    
    # Read prompt files
    prompts_dir = template_dir / "prompts"
    selection_content = read_file_content(prompts_dir / "selection.md")
    usage_content = read_file_content(prompts_dir / "usage.md")
    
    metadata = load_template_metadata(template_name)

    if platform and platform not in metadata["supportedProviders"]:
        log_warn(
            f"Detected platform '{platform}' is not listed in metadata supportedProviders "
            f"for template '{template_name}'. Metadata: {metadata['supportedProviders']}"
        )

    return {
        "name": template_name,
        "language": "typescript",  # Hardcoded as requested
        "frameworks": frameworks,
        "description": {
            "selection": selection_content,
            "usage": usage_content
        },
        "supportedProviders": metadata["supportedProviders"],
        "deploymentType": metadata["deploymentType"],
    }


def main() -> None:
    """Main function to generate template catalog"""
    parser = argparse.ArgumentParser(description="Generate Cloudflare template catalog")
    parser.add_argument(
        "--output", 
        "-o", 
        default="template_catalog.json",
        help="Output JSON file name (default: template_catalog.json)"
    )
    parser.add_argument(
        "--directory",
        "-d",
        default="./build",
        help="Directory to scan for templates (default: current directory)"
    )
    parser.add_argument(
        "--pretty",
        "-p",
        action="store_true",
        help="Pretty-print JSON output"
    )
    args = parser.parse_args()
    
    # Get the directory to scan
    scan_dir = Path(args.directory).resolve()
    output_file = Path(args.output)
    
    log_info("Starting template catalog generation...")
    log_info(f"Scanning directory: {scan_dir}")
    
    templates = []
    template_count = 0
    skipped_count = 0
    
    # Scan directories
    try:
        for item in scan_dir.iterdir():
            # Skip non-directories and hidden/special directories
            if not item.is_dir() or item.name.startswith('.') or item.name in ('node_modules',):
                continue
            
            platform = get_template_platform(item)
            if platform:
                log_info(f"✓ Valid template found: {item.name}")
                template_data = process_template(item, platform)
                templates.append(template_data)
                template_count += 1
            else:
                log_warn(f"✗ Skipping invalid template: {item.name}")
                skipped_count += 1
    except MetadataError as error:
        log_error(str(error))
        sys.exit(1)
    
    # Generate JSON catalog
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            if args.pretty:
                json.dump(templates, f, indent=2, ensure_ascii=False)
            else:
                json.dump(templates, f, ensure_ascii=False)
        
        # Summary
        log_info("Template catalog generation complete!")
        log_info(f"Found {template_count} valid templates")
        log_info(f"Skipped {skipped_count} invalid directories")
        log_info(f"Output saved to: {output_file}")
        
        # Display the generated JSON if outputting to terminal
        # if sys.stdout.isatty():
        #     print("\nGenerated catalog:")
        #     with open(output_file, 'r', encoding='utf-8') as f:
        #         catalog_data = json.load(f)
            # print(json.dumps(catalog_data, indent=2, ensure_ascii=False))
            
    except Exception as e:
        log_error(f"Failed to write output file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
