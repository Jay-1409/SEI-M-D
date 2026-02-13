"""
Kubernetes client helpers — creates Deployments and ClusterIP Services
for user-submitted microservices.
"""

from kubernetes import client, config
import os

NAMESPACE = os.getenv("K8S_NAMESPACE", "user-services")


def _load_config():
    """Load in-cluster config, fall back to kubeconfig for local dev."""
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()


def create_deployment(service_name: str, docker_image: str, container_port: int) -> dict:
    """Create a Kubernetes Deployment for the given microservice."""
    _load_config()
    apps_v1 = client.AppsV1Api()

    container = client.V1Container(
        name=service_name,
        image=docker_image,
        ports=[client.V1ContainerPort(container_port=container_port)],
        image_pull_policy="IfNotPresent",
    )

    pod_spec = client.V1PodSpec(containers=[container])

    template = client.V1PodTemplateSpec(
        metadata=client.V1ObjectMeta(labels={"app": service_name}),
        spec=pod_spec,
    )

    spec = client.V1DeploymentSpec(
        replicas=1,
        selector=client.V1LabelSelector(match_labels={"app": service_name}),
        template=template,
    )

    deployment = client.V1Deployment(
        api_version="apps/v1",
        kind="Deployment",
        metadata=client.V1ObjectMeta(name=service_name, namespace=NAMESPACE),
        spec=spec,
    )

    resp = apps_v1.create_namespaced_deployment(namespace=NAMESPACE, body=deployment)
    return {"name": resp.metadata.name, "uid": resp.metadata.uid}


def create_service(service_name: str, container_port: int) -> dict:
    """Create a ClusterIP Service pointing at the microservice pods."""
    _load_config()
    core_v1 = client.CoreV1Api()

    svc_name = f"{service_name}-service"

    service = client.V1Service(
        api_version="v1",
        kind="Service",
        metadata=client.V1ObjectMeta(name=svc_name, namespace=NAMESPACE),
        spec=client.V1ServiceSpec(
            type="ClusterIP",
            selector={"app": service_name},
            ports=[client.V1ServicePort(
                port=container_port,
                target_port=container_port,
                protocol="TCP",
            )],
        ),
    )

    resp = core_v1.create_namespaced_service(namespace=NAMESPACE, body=service)
    return {"name": resp.metadata.name, "cluster_ip": resp.spec.cluster_ip}


def delete_deployment(service_name: str):
    """Delete a Deployment by name."""
    _load_config()
    apps_v1 = client.AppsV1Api()
    apps_v1.delete_namespaced_deployment(name=service_name, namespace=NAMESPACE)


def delete_service(service_name: str):
    """Delete a Service by name."""
    _load_config()
    core_v1 = client.CoreV1Api()
    svc_name = f"{service_name}-service"
    core_v1.delete_namespaced_service(name=svc_name, namespace=NAMESPACE)
