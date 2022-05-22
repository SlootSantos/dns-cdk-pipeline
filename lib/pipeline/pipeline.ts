import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";

// That is the dev-tools Github connection that you receive when authenticating your AWS account with Github.
const CDK_PIPELINE_SOURCE_CONNECTION =
  "arn:aws:codestar-connections:us-east-1:712363797299:connection/e31e7b81-3693-43f7-9fe9-4411cc94e50e";

// That is the sample repo guiding the Medium article
const cdkSourceInput = CodePipelineSource.connection(
  "SlootSantos/dns-cdk-pipeline",
  "main",
  {
    connectionArn: CDK_PIPELINE_SOURCE_CONNECTION,
  }
);

export class DNSPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "DNS-Pipeline",
      synth: new CodeBuildStep("SynthStep", {
        input: cdkSourceInput,
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });
  }
}
