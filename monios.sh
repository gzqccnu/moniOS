#!/bin/bash
# Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
# https://github.com/gzqccnu/moniOS

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

# get Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    elif [ -f /etc/redhat-release ]; then
        echo "centos"
    elif [ -f /etc/arch-release ]; then
        echo "arch"
    else
        echo "unknown"
    fi
}
DISTRO=$(detect_distro)
info "detected Linux distribution: $DISTRO"

info "starting checking dependencies..."

info "checking git..."
response=""
if ! command -v git &> /dev/null; then
    error "git could not be found, please install git and try again."
    read -p "install git now? (y/n)" -r response
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        if [ "$DISTRO" == "ubuntu" ] || [ "$DISTRO" == "debian" ]; then
            sudo apt install -y git
        elif [ "$DISTRO" == "centos" ] || [ "$DISTRO" == "rhel" ]; then
            sudo yum install -y git
        elif [ "$DISTRO" == "arch" ]; then
            sudo pacman -Sy git
        else
            warn "Unsupported Linux distribution. Please install git manually."
        info "git installation completed."
        fi
    else
        warn "git is required to run this script. Exiting."
        exit 1
    fi
fi

info "checking uv"
if ! command -v uv &> /dev/null; then
    error "uv could not be found, please install uv and try again."
    read -p "install uv now? (y/n)" -r response
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        info "uv installation completed."
    else
        warn "uv is required to run this script. Exiting."
        exit 1
    fi
fi

info "checking iftop and htops are installed..."
if ! command -v iftop &> /dev/null || ! command -v htop &> /dev/null; then
    error "iftop or htop could not be found, please install them and try again."
    read -p "install iftop and htop now? (y/n)" -r response
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        if [ "$DISTRO" == "ubuntu" ] || [ "$DISTRO" == "debian" ]; then
            sudo apt install -y iftop htop
        elif [ "$DISTRO" == "centos" ] || [ "$DISTRO" == "rhel" ]; then
            sudo yum install -y iftop htop
        elif [ "$DISTRO" == "arch" ]; then
            sudo pacman -Sy iftop htop
        else
            warn "Unsupported Linux distribution. Please install iftop and htop manually."
        fi
        info "iftop and htop installation completed."
    else
        warn "iftop and htop are required to run this script. Exiting."
        exit 1
    fi
fi

info "checking osquery..."
if ! command -v osqueryi &> /dev/null; then
    error "osquery could not be found, please install osquery and try again."
    read -p "install osquery now? (y/n)" -r response
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        if [ "$DISTRO" == "ubuntu" ] || [ "$DISTRO" == "debian" ]; then
            sudo apt install -y osquery
        elif [ "$DISTRO" == "centos" ] || [ "$DISTRO" == "rhel" ]; then
            sudo yum install -y osquery
        elif [ "$DISTRO" == "arch" ]; then
            sudo pacman -Sy osquery
        else
            warn "Unsupported Linux distribution. Please install osquery manually."
            info "Refer to https://osquery.io/downloads/official for installation instructions."
        fi
        info "osquery installation completed."
    else
        warn "osquery is required to run this script. Exiting."
        exit 1
    fi
fi

info "refreshing shell environment..."
source ~/.bashrc

info "all dependencies are installed. starting moniOS..."

read -p "which directory do you want to clone moniOS into? (default: ~/moniOS)" -r target_dir
if [ -z "$target_dir" ]; then
    target_dir="$HOME/moniOS"
fi

if [ -d "$target_dir" ]; then
    warn "directory $target_dir already exists."
    read -p "do you want to overwrite it? (y/n)" -r response
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        rm -rf "$target_dir"
        info "existing directory removed."
    else
        info "exiting to avoid overwriting existing directory."
        exit 1
    fi
fi

info "cloning moniOS repository..."
git clone https://github.com/gzqccnu/moniOS.git "$target_dir"
if [ $? -ne 0 ]; then
    error "failed to clone moniOS repository. please check your network connection and try again."
    exit 1
fi
info "moniOS repository cloned to $target_dir"
cd "$target_dir" || { error "failed to enter moniOS directory."; exit 1; }

info "installing python dependencies..."
uv sync
if [ $? -ne 0 ]; then
    error "failed to install python dependencies."
    exit 1
fi
info "python dependencies installed."

read -p "start moniOS now? (y/n)" -r response
if [[ "$response" == "y" || "$response" == "Y" ]]; then
    info "starting moniOS..."
    cat << 'EOF'
                            _  ___  ____
    _ __ ___   ___  _ __ (_)/ _ \/ ___|
    | '_ ` _ \ / _ \| '_ \| | | | \___ \
    | | | | | | (_) | | | | | |_| |___) |
    |_| |_| |_|\___/|_| |_|_|\___/|____/

EOF
    uv run app.py
else
    info "you can start moniOS later by running 'uv run app.py' in the $target_dir directory."
fi