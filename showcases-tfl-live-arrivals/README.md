# TfL Live Arrivals

## Temporary Preview

https://mrduguo.github.io/Spectre0100.github.io/


## File/Folder Structure

1. dinghy.config.yml - Dinghy site configuration
1. src - Main source directory for the site
   1. components - React components
   1. api - Handles data fetching from public APIs
   1. css/custom.css - Custom CSS that is applied to every Docusaurus page
   1. utils - General-purpose utility functions
1. static - Folder for static assets, copied directly to the published site
1. output/site - Build output; all files to be deployed with GitHub Pages are here


## Local Preview

Site commands reference: https://dinghy.dev/references/commands/engine/site

```bash

# Install Dinghy Cli
curl -fsSL https://get.dinghy.dev/install.sh | sh

# Clone repo
git clone https://github.com/mrduguo/Spectre0100.github.io.git
cd Spectre0100.github.io/showcases-tfl-live-arrivals

# Start site
dinghy site start

```
                  
## CI/CD

The [![Deploy TfL Live Arrivals to GitHub Pages](https://github.com/mrduguo/Spectre0100.github.io/actions/workflows/deploy-tfl-live-arrivals.yml/badge.svg)](https://github.com/mrduguo/Spectre0100.github.io/actions/workflows/deploy-tfl-live-arrivals.yml) [workflow](https://github.com/mrduguo/Spectre0100.github.io/blob/main/.github/workflows/deploy-tfl-live-arrivals.yml) automatically publishes updates to GitHub Pages whenever changes are pushed to the main branch.

## Page Speed Test

1. [Before](https://pagespeed.web.dev/analysis/https-spectre0100-github-io/i2asn54s6k?form_factor=desktop)
1. [After](https://pagespeed.web.dev/analysis/https-mrduguo-github-io-Spectre0100-github-io/cys9utypwi?form_factor=desktop)
