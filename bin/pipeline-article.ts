#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";

import { DNSPipelineStack } from "../lib/pipeline/pipeline";

const app = new cdk.App();

new DNSPipelineStack(app, "DNSPipelineStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
