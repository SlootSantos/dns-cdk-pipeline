import { Construct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";

import { RootDomainStack } from "../stacks/root-stack";

export class RootDomainPipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new RootDomainStack(this, "RootDomainStack");
  }
}
