#!/bin/bash

trap "kill 0" SIGINT SIGTERM EXIT

# watch ast
# nodemon -w ionast e ion -x yarn buildAst &
guild build && yarn run watchGrammar &
guild watch &
nodemon -w lib -w src -w external -e js,ts,is,ion --delay 150ms -x yarn test &

wait