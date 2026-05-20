#!/bin/bash

set -e

echo "=================================="
echo "Starting full setup..."
echo "=================================="

scripts=(
    "01_system_update.sh"
    "02_install_packages.sh"
    "03_start_services.sh"
    "04_setup_postgres.sh"
    "05_setup_python.sh"
    "06_install_requirements.sh"
    "07_create_env.sh"
)

for script in "${scripts[@]}"
do
    echo ""
    echo "=================================="
    echo "Running $script"
    echo "=================================="

    chmod +x "$script"
    ./"$script"
done

echo ""
echo "=================================="
echo "All scripts executed successfully!"
echo "=================================="