#!/bin/bash

# Step 1: SCP "web" and "app" to GCP "~" location
npx nx run-many --target=build --all --prod --with-deps
