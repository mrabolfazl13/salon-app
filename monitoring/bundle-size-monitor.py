#!/usr/bin/env python3
"""
Bundle Size Monitor for Futsal Booking System
Tracks frontend and backend build sizes over time to detect regressions.

Usage:
    python bundle-size-monitor.py --frontend-dist ./dist
    python bundle-size-monitor.py --backend-image salon-backend:latest
"""

import os
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime


def get_frontend_size(dist_path: str) -> dict:
    """Calculate total and per-chunk size of frontend build."""
    dist = Path(dist_path)
    if not dist.exists():
        raise FileNotFoundError(f"Frontend dist not found: {dist_path}")
    
    files = []
    total_size = 0
    
    for file in dist.rglob("*"):
        if file.is_file():
            size = file.stat().st_size
            files.append({
                "path": str(file.relative_to(dist)),
                "size_bytes": size,
                "size_kb": round(size / 1024, 2),
            })
            total_size += size
    
    # Sort by size (largest first)
    files.sort(key=lambda x: x["size_bytes"], reverse=True)
    
    return {
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "file_count": len(files),
        "files": files[:20],  # Top 20 largest files
    }


def get_docker_image_size(image_name: str) -> dict:
    """Get Docker image size using docker inspect."""
    try:
        result = subprocess.run(
            ["docker", "inspect", "--format='{{.Size}}'", image_name],
            capture_output=True,
            text=True,
            check=True,
        )
        size_bytes = int(result.stdout.strip().strip("'"))
        
        return {
            "image": image_name,
            "size_bytes": size_bytes,
            "size_mb": round(size_bytes / (1024 * 1024), 2),
        }
    except subprocess.CalledProcessError as e:
        print(f"Error getting Docker image size: {e}")
        return None


def check_thresholds(frontend_data: dict, thresholds: dict) -> list:
    """Check if build sizes exceed thresholds."""
    warnings = []
    
    max_size_mb = thresholds.get("max_frontend_mb", 5)
    if frontend_data["total_size_mb"] > max_size_mb:
        warnings.append(
            f"⚠️ Frontend build size ({frontend_data['total_size_mb']}MB) exceeds threshold ({max_size_mb}MB)"
        )
    
    # Check individual chunk sizes
    max_chunk_mb = thresholds.get("max_chunk_mb", 500)
    for file in frontend_data["files"]:
        if file["size_kb"] > max_chunk_mb:
            warnings.append(
                f"⚠️ Large chunk detected: {file['path']} ({file['size_kb']}KB > {max_chunk_mb}KB)"
            )
    
    return warnings


def save_report(data: dict, output_dir: str = "monitoring/reports"):
    """Save build report to JSON file."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"bundle_report_{timestamp}.json"
    
    with open(output_path / filename, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"📊 Report saved to: {output_path / filename}")


def main():
    parser = argparse.ArgumentParser(description="Monitor bundle sizes")
    parser.add_argument("--frontend-dist", help="Path to frontend dist directory")
    parser.add_argument("--backend-image", help="Backend Docker image name")
    parser.add_argument("--thresholds", help="JSON file with size thresholds")
    parser.add_argument("--ci", action="store_true", help="Run in CI mode (fail on threshold)")
    
    args = parser.parse_args()
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "frontend": None,
        "backend": None,
        "warnings": [],
    }
    
    # Load thresholds
    thresholds = {}
    if args.thresholds and Path(args.thresholds).exists():
        with open(args.thresholds) as f:
            thresholds = json.load(f)
    else:
        thresholds = {
            "max_frontend_mb": 5,
            "max_chunk_mb": 500,
            "max_backend_mb": 500,
        }
    
    # Analyze frontend
    if args.frontend_dist:
        print("📦 Analyzing frontend build...")
        try:
            frontend_data = get_frontend_size(args.frontend_dist)
            report["frontend"] = frontend_data
            print(f"   Total size: {frontend_data['total_size_mb']}MB")
            print(f"   File count: {frontend_data['file_count']}")
            
            # Check thresholds
            warnings = check_thresholds(frontend_data, thresholds)
            report["warnings"].extend(warnings)
        except Exception as e:
            print(f"❌ Error analyzing frontend: {e}")
    
    # Analyze backend
    if args.backend_image:
        print("🐳 Analyzing backend Docker image...")
        backend_data = get_docker_image_size(args.backend_image)
        if backend_data:
            report["backend"] = backend_data
            print(f"   Image size: {backend_data['size_mb']}MB")
            
            max_backend_mb = thresholds.get("max_backend_mb", 500)
            if backend_data["size_mb"] > max_backend_mb:
                report["warnings"].append(
                    f"⚠️ Backend image size ({backend_data['size_mb']}MB) exceeds threshold ({max_backend_mb}MB)"
                )
    
    # Print warnings
    if report["warnings"]:
        print("\n⚠️  Warnings:")
        for warning in report["warnings"]:
            print(f"   {warning}")
    
    # Save report
    save_report(report)
    
    # Exit with error in CI mode if warnings exist
    if args.ci and report["warnings"]:
        print("\n❌ Bundle size checks failed!")
        exit(1)
    else:
        print("\n✅ Bundle size analysis complete!")


if __name__ == "__main__":
    main()
