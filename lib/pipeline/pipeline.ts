import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { accounts } from "../constants/accounts";
import { mainRegion } from "../constants/regions";
import { RootDomainPipelineStage } from "./root-stage";
import { DelegatedDomainPipelineStage } from "./application-stage";

// That is the dev-tools Github connection that you receive when authenticating your AWS account with Github.
const CDK_PIPELINE_SOURCE_CONNECTION =
  "arn:aws:codestar-connections:eu-central-1:638500442919:connection/611d288d-7067-41ce-b730-980d659690d5";

// That is the sample repo guiding the Medium article
const cdkSourceInput = CodePipelineSource.connection(
  "SlootSantos/dns-cdk-pipeline",
  "main",
  {
    connectionArn: CDK_PIPELINE_SOURCE_CONNECTION,
  }
);

const applicationStages: {
  targetAccount: string; // this will be the account we're rolling out to
  stageName: "dev" | "prod"; // this is also going to be the subdomain => dev.domain.com
}[] = [
  {
    stageName: "dev",
    targetAccount: accounts.dev,
  },
  {
    stageName: "prod",
    targetAccount: accounts.prod,
  },
];

export class DNSPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      crossAccountKeys: true,
      pipelineName: "DNS-Pipeline",
      synth: new CodeBuildStep("SynthStep", {
        input: cdkSourceInput,
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    const rootDomain = new RootDomainPipelineStage(
      this,
      `root-${accounts.rootDomain}`,
      {
        env: {
          region: mainRegion,
          account: accounts.rootDomain,
        },
      }
    );

    // manually adding the "special" root domain stack as first stage in the pipeline
    pipeline.addStage(rootDomain);

    // for each of the application stages, add stage to the pipeline
    applicationStages.forEach((stage) => {
      const applicationDomain = new DelegatedDomainPipelineStage(
        this,
        `${stage.stageName}-${stage.targetAccount}`,
        {
          stage: stage.stageName,
          env: {
            region: mainRegion,
            account: stage.targetAccount,
          },
        }
      );

      pipeline.addStage(applicationDomain);
    });
  }
}
