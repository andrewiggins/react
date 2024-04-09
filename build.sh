#!/bin/bash

DEST=$1

# Verify that $DEST was provided and fail if not
if [ -z "$DEST" ]; then
  echo "Please provide the path you'd like the build output to be copied to as the first argument"
  exit 1
fi


CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
MERGE_BASE=$(git merge-base main $CURRENT_BRANCH)
COMMIT_SHA=$(git rev-parse --short $MERGE_BASE)

echo "DEST: $DEST"
echo "CURRENT_BRANCH: $CURRENT_BRANCH"
echo "MERGE_BASE: $MERGE_BASE"
echo "COMMIT_SHA: $COMMIT_SHA"

yarn build

# React
cp build/oss-stable/react/umd/react.development.js $DEST/react.$COMMIT_SHA.development.js
cp build/oss-stable/react/umd/react.profiling.min.js $DEST/react.$COMMIT_SHA.profiling.min.js
cp build/oss-stable/react/umd/react.production.min.js $DEST/react.$COMMIT_SHA.production.min.js

# React DOM
cp build/oss-stable/react-dom/umd/react-dom.development.js $DEST/react-dom.$COMMIT_SHA.development.js
cp build/oss-stable/react-dom/umd/react-dom.profiling.min.js $DEST/react-dom.$COMMIT_SHA.profiling.min.js
cp build/oss-stable/react-dom/umd/react-dom.production.min.js $DEST/react-dom.$COMMIT_SHA.production.min.js

# Scheduler
cp build/oss-stable/scheduler/umd/scheduler.development.js $DEST/scheduler.$COMMIT_SHA.development.js
cp build/oss-stable/scheduler/umd/scheduler.profiling.min.js $DEST/scheduler.$COMMIT_SHA.profiling.min.js
cp build/oss-stable/scheduler/umd/scheduler.production.min.js $DEST/scheduler.$COMMIT_SHA.production.min.js

# # React Cache
# cp build/oss-stable/react-cache/cjs/react-cache.development.js $DEST/react-cache.$COMMIT_SHA.development.js
# cp build/oss-stable/react-cache/cjs/react-cache.production.min.js $DEST/react-cache.$COMMIT_SHA.production.min.js
