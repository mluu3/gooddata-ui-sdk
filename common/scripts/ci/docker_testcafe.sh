#!/bin/bash
set -eu
set -o pipefail

# Absolute root directory - for volumes
ROOT_DIR=$(echo $(cd $(dirname "${BASH_SOURCE[0]}")/../../.. && pwd -P))

CAPTURE_BASE_PATTERN='${DATE}_${TIME}/${TEST_ID}_${FIXTURE}/${RUN_ID}/${FILE_INDEX}_${TEST}'

echo "Running testcafe tests using ${IMAGE_ID} in root directory ${ROOT_DIR}"

echo "---------------------------"
echo "--- starting: testcafe-cli "
echo "---------------------------"

docker run \
    --rm --shm-size="1g" \
    -v $PWD:/gooddata-ui-sdk \
    -u $(id -u ${USER}):$(id -g ${USER}) \
    -w /gooddata-ui-sdk \
    ${IMAGE_ID} \
    chromium -c 5 -q -r spec,xunit:examples/sdk-examples/ci/results/testcafe-results.xml \
    --assertion-timeout 60000 --selector-timeout 10000 \
    --screenshots-on-fails --screenshots examples/sdk-examples/_screenshots \
    --screenshot-path-pattern "${CAPTURE_BASE_PATTERN}.png" \
    --url "https://${APP_HOST}" \
    'examples/sdk-examples/test/**/**/*_test*' \
    || true
# prove returns non-zero status code if tests fails
# ignore the status and let the junit publisher mark the build unstable instead
