import { Construct } from "constructs";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";

import { domains } from "../constants/domains";
import { buildDelegatedDomainHostedZone } from "../services/Route53/delegatedDomainHostedZone";
import { buildDelegatedNameServerRecord } from "../services/CustomResources/delegatedNameServerRecord";

interface DelegatedDomainStackProps extends StackProps {
  stageConfig: {
    stage: "dev" | "prod";
  };
}

export class DelegatedDomainStack extends Stack {
  delegatedSubdomain: CfnOutput;
  delegatedNameServers: CfnOutput;

  constructor(scope: Construct, id: string, props: DelegatedDomainStackProps) {
    super(scope, id, props);

    const hostedZone = buildDelegatedDomainHostedZone(
      this,
      props.stageConfig.stage
    );

    const delegatedNameServerList = buildDelegatedNameServerRecord(
      this,
      props.stageConfig.stage,
      hostedZone
    );

    this.delegatedNameServers = new CfnOutput(this, "DelegatedNameServers", {
      // we use this format with the space delimiter as we're using it sanity test script as well
      value: delegatedNameServerList.join(" "),
    });

    this.delegatedSubdomain = new CfnOutput(this, "DelegatedSubdomain", {
      // we use this format with the space delimiter as we're using it sanity test script as well
      value: `${props.stageConfig.stage}.${domains.root}`,
    });
  }
}
