import os
import platform
import subprocess
import sys

def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    system = platform.system()

    if system == "Windows":
        # Use PowerShell script
        script_path = os.path.join(project_root, "dev.ps1")
        if not os.path.exists(script_path):
            print("dev.ps1 not found in project root.")
            sys.exit(1)

        cmd = [
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-File", script_path,
        ]
    else:
        # Use bash script
        script_path = os.path.join(project_root, "dev.sh")
        if not os.path.exists(script_path):
            print("dev.sh not found in project root.")
            sys.exit(1)

        cmd = ["bash", script_path]

    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Dev script failed with exit code {e.returncode}")
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()
