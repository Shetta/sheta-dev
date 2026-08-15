---
title: "How AWS handles one file upload"
description: "Use an S3 upload to understand AWS control planes, data planes, accounts, Regions, IAM, APIs, and cost."
published: 2026-08-15
updated: 2026-08-15
tags: [aws, beginners, s3, iam, cloud, control-plane, data-plane]
level: beginner
series: "Cloud systems"
nextPost: the-replay-that-outgrew-the-cross-account-relay
---

Amazon Web Services, or AWS, provides compute, storage, database, and networking capabilities through service APIs.

An upload to Amazon Simple Storage Service, or Amazon S3, is a data-plane request. The bucket must exist before that request. Creating and configuring the bucket are control-plane requests.

AWS and other distributed systems use this distinction. The control plane changes configuration. The data plane performs the work that users and applications need.

An AWS account contains both planes. A Region sets the geographic boundary for most resources. AWS evaluates authorization for each request. The service records usage for billing.

<figure class="architecture-figure">
  <img src="/diagrams/s3-control-data-planes.svg" width="1200" height="700" loading="lazy" decoding="async" alt="A client sends separate control-plane and data-plane requests to Amazon S3. Authorization policies apply to both requests. Stored bucket configuration constrains later object requests." />
  <figcaption>Figure 1. Bucket creation and configuration use control-plane APIs. Object traffic uses data-plane APIs. AWS evaluates authorization policies for both requests.</figcaption>
</figure>

## Start with the API request

The AWS Management Console gives you forms and buttons. The AWS Command Line Interface, or CLI, gives you shell commands. An AWS software development kit, or SDK, gives your application language-specific functions.

All three tools call service APIs. The console does not use a separate management system. When the console reports that `s3:PutObject` was denied, it names the API action that failed.

Each request includes an identity, an action, a resource, and context. Context can include the Region, source network, time, or encryption requirements. AWS uses these fields to decide whether it will perform the action.

## The control plane changes configuration

A control plane provides administrative APIs. These APIs create, describe, update, list, and delete resources. AWS uses the term for actions such as creating an S3 bucket or launching an Amazon EC2 instance.

For this example, `CreateBucket` is a control-plane action. The request selects the bucket name and Region. Later control-plane requests can change lifecycle rules, public-access settings, encryption settings, or access points.

Control-plane work can coordinate several systems. An EC2 launch can allocate a host, network interface, storage, credentials, and security rules. AWS separates this work from the service traffic that follows. [AWS describes its control planes and data planes](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/control-planes-and-data-planes.html).

A recovery plan that creates resources during an outage depends on control-plane operations. AWS recommends that high-availability designs prepare capacity before an event when the workload permits it. Existing data-plane resources can then continue to serve traffic. [The AWS Reliability Pillar explains this design rule](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/understanding-availability-needs.html).

## The data plane performs the service work

A data plane provides the service's primary function. For S3, `PutObject` writes an object and `GetObject` reads it. For EC2, the running instance and its network traffic belong to the data plane. DynamoDB item reads and writes are also data-plane operations.

The bucket configuration tells the S3 data plane how to handle the object request. The data plane applies the current permissions, encryption settings, and storage rules. It then stores the object bytes and metadata or returns an error.

Data planes handle the service's regular traffic. AWS designs them with fewer dependencies than control planes and gives them higher availability goals for many services. Separate planes let AWS scale configuration work and request traffic for different loads.

Control plane and data plane are architectural roles. They do not mean that every service uses one shared control-plane network or one shared data-plane network. Each AWS service implements the boundary for its own APIs.

## The account sets an ownership boundary

An AWS account owns resources and connects them to identities and billing. AWS treats the account as an access and billing boundary. [AWS documents the account model](https://docs.aws.amazon.com/accounts/latest/reference/accounts-welcome.html).

If an identity in one account requests an object from another account, the request crosses an account boundary. The resource owner must allow that access. A cross-account request does not imply a different Region or a different company.

Each account has a root user with complete access. Register multi-factor authentication for that user. Reserve it for tasks that require root credentials. Use a separate administrative identity for daily work, and do not create root access keys. [AWS lists its root-user practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html).

## The Region sets a location boundary

AWS divides its infrastructure into Regions. A Region is a separate geographic area, such as US East in Northern Virginia. You select a Region when you create an S3 bucket.

Each Region contains multiple Availability Zones. An Availability Zone has independent power, networking, and connectivity. Applications can use more than one zone to limit the effect of a location failure. [AWS explains Regions and Availability Zones](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html).

S3 manages object placement for the selected storage class. S3 Standard stores data across at least three Availability Zones in one Region. AWS does not copy the object to another Region unless you configure a feature that does so. [Amazon S3 documents its redundancy model](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html).

Region selection can affect latency, service availability, legal requirements, and price. Record the Region with the project configuration. A resource name without its Region can be an incomplete address.

## Services contain resources and actions

An AWS service provides a capability. S3 provides object storage. A resource is something that you create or address. S3 buckets and objects are resources. An action is an API operation such as `s3:PutObject`.

AWS gives many resources an Amazon Resource Name, or ARN. An ARN identifies a resource in an API request or policy. Each service defines its own ARN format.

Amazon EC2 uses the same terms. EC2 is a compute service. An EC2 instance is a resource. `ec2:StartInstances` is an action.

## AWS evaluates authorization

IAM defines identities and many of the policies that control access to AWS resources. The target service evaluates the principal, action, resource, and request context against the applicable policies.

For the upload, AWS answers one question: can this principal perform `s3:PutObject` on this object? The decision can include an identity policy, bucket policy, permissions boundary, session policy, organization policy, or VPC endpoint policy. S3 Block Public Access can add another restriction. Not every control applies to every request.

An explicit denial overrides an allow. AWS denies the request when no applicable policy allows it. [AWS documents policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html).

An `AccessDenied` response can mean that IAM recognized the principal but found no applicable allow. Valid credentials do not grant every action on every resource.

Use roles or federated identities when they can provide temporary credentials. Long-lived access keys increase the damage that a leaked credential can cause.

## Usage creates cost

Each AWS service defines its billing measurements. S3 can charge for stored data, API requests, data processing, retrieval, and data transfer. The applicable measurements depend on the storage class and request path.

An upload can add stored bytes and a request charge. A later download can add another request and data-transfer charges. Read the current S3 pricing page before you design around a cost assumption.

New AWS customers can receive credits under the current AWS Free Tier program. Accounts created after July 15, 2025 can select a free plan. The plan ends after six months or when its credits are depleted. Older accounts follow the legacy program. [AWS documents the current Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html).

AWS Budgets can send alerts and run configured actions. A budget alert is not a real-time spending cap. AWS updates budget information several times each day. Charges can continue before an alert arrives. [AWS documents budget timing](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

## AWS and you divide operational work

AWS operates the physical infrastructure and the managed service. You control your data, identities, permissions, and service configuration. AWS calls this division the shared responsibility model. [AWS explains the shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/).

For an S3 object, AWS operates the storage hardware and service software. You decide who can read the object. You also select encryption, retention, and public-access settings.

A managed service removes specified operational tasks. It does not make each customer configuration safe. Check the service documentation to find the tasks that remain yours.

## Create one test object

You can read this article without an AWS account. If you use an account, secure it before the exercise. AWS provides a [setup guide for a new environment](https://docs.aws.amazon.com/hands-on/latest/setup-environment/setup-environment.html).

Use an administrative identity for this procedure. Do not use the root user.

1. Open the Amazon S3 console.
2. Record the selected Region.
3. Create one general-purpose bucket.
4. Keep Block Public Access enabled.
5. Upload one small text file.
6. Open the object's properties.
7. Identify the bucket, object key, Region, and storage class.
8. Delete the object.
9. Delete the empty bucket.
10. Check Free Tier usage and billing.

Do not make the object public. Delete the test resources when the exercise is complete.

The procedure uses two planes. Bucket creation and deletion use the control plane. Object upload and deletion use the data plane. AWS evaluates authorization and records the applicable usage.

## Apply the model to another architecture

Consider this statement from the next article: an EMR job in Account A writes to a Kinesis stream in Account B.

Account A and Account B define ownership and access boundaries. EMR and Kinesis are services. The job and stream are resources. IAM policies must allow the write action across the account boundary.

Creating the stream and configuring its policy use control-plane APIs. Sending records to the existing stream uses the Kinesis data plane. The same separation applies when you examine deployment, recovery, and scaling decisions in other distributed systems.
