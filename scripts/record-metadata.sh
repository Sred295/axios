#!/bin/bash

echo "Commit Hash: $(git rev-parse HEAD)" >> logs/scan-info-${GITHUB_SHA}.txt
echo "Trivy Version: $(trivy --version)" >> logs/scan-info-${GITHUB_SHA}.txt

if command -v osv-scanner &> /dev/null
then
    echo "OSV-Scanner Version: $(osv-scanner --version)" >> logs/scan-info-${GITHUB_SHA}.txt
else
    echo "OSV-Scanner not installed" >> logs/scan-info-${GITHUB_SHA}.txt
fi

date >> logs/scan-info-${GITHUB_SHA}.txt

