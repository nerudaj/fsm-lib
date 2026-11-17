#!/bin/bash

if [[ $# -eq 0 ]]; then
    echo "Usage: sudo bash install_ubuntu_deps.sh <clang-version>"
    echo "  for example if you have clang++-18, run: 'sudo bash install_ubuntu_deps.sh 18'"
    exit 0
fi

if [[ $# -ne 1 ]]; then
    echo "ERROR: Expected installed clang version as a first argument"
    exit 1
fi

apt install libc++-$1-dev libc++abi-$1-dev
