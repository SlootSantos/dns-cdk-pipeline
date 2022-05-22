import { Construct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";
import { DelegatedDomainStack } from "../stacks/application-stack";

interface DelegatedDomainPipelineStageProps extends StageProps {
  stage: "dev" | "prod";
}

export class DelegatedDomainPipelineStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    props: DelegatedDomainPipelineStageProps
  ) {
    super(scope, id, props);

    new DelegatedDomainStack(this, "DelegatedDomainStack", {
      stageConfig: {
        stage: props.stage,
      },
    });
  }
}
