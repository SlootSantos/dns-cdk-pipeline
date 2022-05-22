import { Construct } from "constructs";
import { CodeBuildStep, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { BuildSpec, ComputeType } from "aws-cdk-lib/aws-codebuild";
import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";

import { DelegatedDomainStack } from "../stacks/application-stack";

interface DelegatedDomainPipelineStageProps extends StageProps {
  stage: "dev" | "prod";
}

export class DelegatedDomainPipelineStage extends Stage {
  delegatedSubdomain: CfnOutput;
  delegatedNameServers: CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    props: DelegatedDomainPipelineStageProps
  ) {
    super(scope, id, props);

    const delegationStack = new DelegatedDomainStack(
      this,
      "DelegatedDomainStack",
      {
        stageConfig: {
          stage: props.stage,
        },
      }
    );

    this.delegatedSubdomain = delegationStack.delegatedSubdomain;
    this.delegatedNameServers = delegationStack.delegatedNameServers;
  }

  buildSanityCheckCodeBuild(input: CodePipelineSource) {
    const installCommands: string[] = [
      "sudo apt-get update -y",
      "sudo apt-get install dnsutils -y",
    ];
    const buildCommands: string[] = ["./scripts/verify_dns.sh"];

    const buildPhases = {
      install: {
        commands: installCommands,
      },
      build: {
        commands: buildCommands,
      },
    };

    return new CodeBuildStep("SanityCheckDNS", {
      input,
      buildEnvironment: {
        privileged: true,
        computeType: ComputeType.SMALL,
      },
      envFromCfnOutputs: {
        DELEGATED_DOMAIN_NAME: this.delegatedSubdomain,
        DELEGATED_NAME_SERVERS: this.delegatedNameServers,
      },
      commands: [],
      partialBuildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: buildPhases,
      }),
    });
  }
}
