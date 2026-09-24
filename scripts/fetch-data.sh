#!/bin/sh
# Checks out the data branch into data/, where the site reads it: what every repository's CI
# recorded about its latest run, its manifest and what its sources declare.
set -eu
cd "$(dirname "$0")/.."
if [ -d data/.git ]; then
  git -C data pull --quiet --ff-only
else
  rm -rf data
  git clone --quiet --depth 1 --branch data https://github.com/Vania-Metrics/vania-metrics.github.io.git data
fi
echo "data: $(ls data | wc -l) repositories"
