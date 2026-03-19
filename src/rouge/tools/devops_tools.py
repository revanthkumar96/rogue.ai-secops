"""DevOps tools for ROUGE agents - Terraform, Kubernetes, Docker, CI/CD, and Observability."""

import json
import subprocess
import tempfile
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional


class DevOpsTools:
    """Collection of DevOps automation tools for ROUGE agents"""

    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.deliverables_path = self.repo_path / "deliverables"
        self.deliverables_path.mkdir(exist_ok=True, parents=True)

    # ============================================
    # Infrastructure as Code (Terraform)
    # ============================================

    async def terraform_plan(
        self,
        working_dir: str,
        var_file: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run Terraform plan to preview infrastructure changes

        Args:
            working_dir: Directory containing Terraform configuration
            var_file: Optional path to variables file

        Returns:
            Dict with plan output and change summary
        """
        try:
            cmd = ["terraform", "plan", "-no-color"]
            if var_file:
                cmd.extend(["-var-file", var_file])

            working_path = self.repo_path / working_dir

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                cwd=str(working_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "has_changes": "Plan:" in result.stdout and "No changes" not in result.stdout,
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": "Terraform not found. Install from https://www.terraform.io/downloads",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Terraform plan timeout (5 minutes)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def terraform_apply(
        self,
        working_dir: str,
        auto_approve: bool = False,
    ) -> Dict[str, Any]:
        """
        Apply Terraform configuration to provision infrastructure

        Args:
            working_dir: Directory containing Terraform configuration
            auto_approve: Skip interactive approval (use with caution!)

        Returns:
            Dict with apply results
        """
        try:
            cmd = ["terraform", "apply", "-no-color"]
            if auto_approve:
                cmd.append("-auto-approve")

            working_path = self.repo_path / working_dir

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1800,  # 30 minute timeout for provisioning
                cwd=str(working_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "applied": "Apply complete!" in result.stdout,
            }

        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Terraform apply timeout (30 minutes)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def terraform_init(self, working_dir: str) -> Dict[str, Any]:
        """
        Initialize Terraform working directory

        Args:
            working_dir: Directory containing Terraform configuration

        Returns:
            Dict with initialization results
        """
        try:
            working_path = self.repo_path / working_dir

            result = subprocess.run(
                ["terraform", "init", "-no-color"],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(working_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Kubernetes Operations (kubectl)
    # ============================================

    async def kubectl_apply(
        self,
        manifest_path: str,
        namespace: str = "default",
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Apply Kubernetes manifest

        Args:
            manifest_path: Path to manifest file or directory
            namespace: Kubernetes namespace
            context: Kubernetes context to use

        Returns:
            Dict with apply results
        """
        try:
            cmd = ["kubectl", "apply", "-f", manifest_path, "-n", namespace]
            if context:
                cmd.extend(["--context", context])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(self.repo_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "resources_created": result.stdout.count("created"),
                "resources_configured": result.stdout.count("configured"),
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": "kubectl not found. Install from https://kubernetes.io/docs/tasks/tools/",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def kubectl_get(
        self,
        resource_type: str,
        namespace: str = "default",
        output: str = "json",
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get Kubernetes resources

        Args:
            resource_type: Resource type (e.g., "pods", "services", "deployments")
            namespace: Kubernetes namespace
            output: Output format ("json", "yaml", "wide")
            context: Kubernetes context to use

        Returns:
            Dict with resource information
        """
        try:
            cmd = ["kubectl", "get", resource_type, "-n", namespace, "-o", output]
            if context:
                cmd.extend(["--context", context])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
                cwd=str(self.repo_path),
            )

            resources = None
            if result.returncode == 0 and output == "json":
                try:
                    resources = json.loads(result.stdout)
                except:
                    pass

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "resources": resources,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def helm_install(
        self,
        release_name: str,
        chart: str,
        namespace: str = "default",
        values_file: Optional[str] = None,
        create_namespace: bool = True,
    ) -> Dict[str, Any]:
        """
        Install Helm chart

        Args:
            release_name: Name for the Helm release
            chart: Chart reference (e.g., "bitnami/nginx")
            namespace: Kubernetes namespace
            values_file: Optional values file path
            create_namespace: Create namespace if it doesn't exist

        Returns:
            Dict with installation results
        """
        try:
            cmd = ["helm", "install", release_name, chart, "-n", namespace]
            if create_namespace:
                cmd.append("--create-namespace")
            if values_file:
                cmd.extend(["-f", values_file])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(self.repo_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "release_name": release_name,
                "namespace": namespace,
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": "Helm not found. Install from https://helm.sh/docs/intro/install/",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Docker Operations
    # ============================================

    async def docker_build(
        self,
        dockerfile_path: str,
        tag: str,
        build_args: Optional[Dict[str, str]] = None,
        context_path: str = ".",
    ) -> Dict[str, Any]:
        """
        Build Docker image

        Args:
            dockerfile_path: Path to Dockerfile
            tag: Image tag (e.g., "myapp:latest")
            build_args: Build arguments
            context_path: Build context path

        Returns:
            Dict with build results
        """
        try:
            cmd = ["docker", "build", "-f", dockerfile_path, "-t", tag]

            if build_args:
                for key, value in build_args.items():
                    cmd.extend(["--build-arg", f"{key}={value}"])

            cmd.append(context_path)

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1800,  # 30 minute timeout for large builds
                cwd=str(self.repo_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "image_tag": tag,
                "built": "Successfully built" in result.stdout or "Successfully tagged" in result.stdout,
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": "Docker not found. Install from https://docs.docker.com/get-docker/",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Docker build timeout (30 minutes)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def docker_run(
        self,
        image: str,
        ports: Optional[List[str]] = None,
        env_vars: Optional[Dict[str, str]] = None,
        volumes: Optional[List[str]] = None,
        name: Optional[str] = None,
        detached: bool = True,
    ) -> Dict[str, Any]:
        """
        Run Docker container

        Args:
            image: Docker image to run
            ports: Port mappings (e.g., ["8080:80", "443:443"])
            env_vars: Environment variables
            volumes: Volume mounts (e.g., ["/host/path:/container/path"])
            name: Container name
            detached: Run in detached mode

        Returns:
            Dict with container run results
        """
        try:
            cmd = ["docker", "run"]

            if detached:
                cmd.append("-d")

            if name:
                cmd.extend(["--name", name])

            if ports:
                for port in ports:
                    cmd.extend(["-p", port])

            if env_vars:
                for key, value in env_vars.items():
                    cmd.extend(["-e", f"{key}={value}"])

            if volumes:
                for volume in volumes:
                    cmd.extend(["-v", volume])

            cmd.append(image)

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(self.repo_path),
            )

            container_id = result.stdout.strip() if result.returncode == 0 else None

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "container_id": container_id,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # CI/CD Integration
    # ============================================

    async def github_actions_create(
        self,
        workflow_name: str,
        triggers: List[str],
        jobs: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Create GitHub Actions workflow file

        Args:
            workflow_name: Name of the workflow
            triggers: Trigger events (e.g., ["push", "pull_request"])
            jobs: List of job definitions

        Returns:
            Dict with workflow file creation results
        """
        try:
            # Create .github/workflows directory
            workflows_dir = self.repo_path / ".github" / "workflows"
            workflows_dir.mkdir(parents=True, exist_ok=True)

            # Build workflow YAML
            workflow = {
                "name": workflow_name,
                "on": triggers,
                "jobs": {},
            }

            for job in jobs:
                job_name = job.get("name", "job")
                workflow["jobs"][job_name] = {
                    "runs-on": job.get("runs_on", "ubuntu-latest"),
                    "steps": job.get("steps", []),
                }

            # Write workflow file
            workflow_file = workflows_dir / f"{workflow_name.lower().replace(' ', '-')}.yml"
            with open(workflow_file, "w") as f:
                yaml.dump(workflow, f, default_flow_style=False, sort_keys=False)

            return {
                "success": True,
                "workflow_file": str(workflow_file),
                "workflow_name": workflow_name,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def jenkins_create_job(
        self,
        job_name: str,
        jenkinsfile_path: str,
    ) -> Dict[str, Any]:
        """
        Create Jenkins job configuration (generates XML config)

        Args:
            job_name: Name for the Jenkins job
            jenkinsfile_path: Path to Jenkinsfile

        Returns:
            Dict with job creation results
        """
        # NOTE: In production, this would use python-jenkins library to interact with Jenkins API
        # For now, we'll generate the job XML config file
        try:
            job_config = f"""<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <description>Generated by ROUGE</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.87">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@4.7.1">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>$PROJECT_URL</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
    </scm>
    <scriptPath>{jenkinsfile_path}</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>"""

            config_file = self.deliverables_path / f"jenkins-job-{job_name}.xml"
            config_file.write_text(job_config)

            return {
                "success": True,
                "job_name": job_name,
                "config_file": str(config_file),
                "note": "Upload this XML to Jenkins via API or UI to create the job",
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Observability (Prometheus, Grafana, ELK)
    # ============================================

    async def prometheus_query(
        self,
        query: str,
        prometheus_url: str = "http://localhost:9090",
        time_range: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Query Prometheus metrics

        Args:
            query: PromQL query
            prometheus_url: Prometheus server URL
            time_range: Optional time range (e.g., "1h", "24h")

        Returns:
            Dict with query results
        """
        try:
            import requests

            endpoint = f"{prometheus_url}/api/v1/query"
            params = {"query": query}

            if time_range:
                endpoint = f"{prometheus_url}/api/v1/query_range"
                # Simple time range parsing (would be more sophisticated in production)
                params["start"] = f"-{time_range}"
                params["end"] = "now"
                params["step"] = "15s"

            response = requests.get(endpoint, params=params, timeout=30)
            data = response.json()

            return {
                "success": response.status_code == 200 and data.get("status") == "success",
                "data": data.get("data", {}),
                "query": query,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def grafana_create_dashboard(
        self,
        dashboard_json: Dict[str, Any],
        grafana_url: str = "http://localhost:3000",
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create Grafana dashboard

        Args:
            dashboard_json: Dashboard definition (Grafana JSON format)
            grafana_url: Grafana server URL
            api_key: Grafana API key

        Returns:
            Dict with dashboard creation results
        """
        try:
            import requests

            headers = {}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            headers["Content-Type"] = "application/json"

            endpoint = f"{grafana_url}/api/dashboards/db"
            payload = {"dashboard": dashboard_json, "overwrite": False}

            response = requests.post(endpoint, json=payload, headers=headers, timeout=30)

            return {
                "success": response.status_code in [200, 201],
                "response": response.json() if response.ok else response.text,
                "dashboard_url": f"{grafana_url}/d/{dashboard_json.get('uid', '')}",
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def elasticsearch_query(
        self,
        index: str,
        query: Dict[str, Any],
        es_url: str = "http://localhost:9200",
        time_range: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Query Elasticsearch logs

        Args:
            index: Elasticsearch index pattern
            query: Elasticsearch query DSL
            es_url: Elasticsearch URL
            time_range: Optional time range filter

        Returns:
            Dict with query results
        """
        try:
            import requests

            endpoint = f"{es_url}/{index}/_search"

            # Add time range filter if provided
            if time_range and "query" in query:
                if "bool" not in query["query"]:
                    query["query"] = {"bool": {"must": [query["query"]]}}

                # Simple time range (would be more sophisticated in production)
                query["query"]["bool"]["filter"] = [
                    {"range": {"@timestamp": {"gte": f"now-{time_range}"}}}
                ]

            response = requests.post(endpoint, json=query, timeout=30)
            data = response.json()

            return {
                "success": response.status_code == 200,
                "hits": data.get("hits", {}).get("hits", []),
                "total_hits": data.get("hits", {}).get("total", {}).get("value", 0),
                "took_ms": data.get("took", 0),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Configuration Management (Ansible)
    # ============================================

    async def ansible_playbook_run(
        self,
        playbook_path: str,
        inventory: str,
        extra_vars: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Run Ansible playbook

        Args:
            playbook_path: Path to playbook YAML file
            inventory: Inventory file or host list
            extra_vars: Extra variables to pass to playbook
            tags: Playbook tags to run

        Returns:
            Dict with playbook execution results
        """
        try:
            cmd = ["ansible-playbook", playbook_path, "-i", inventory]

            if extra_vars:
                extra_vars_json = json.dumps(extra_vars)
                cmd.extend(["--extra-vars", extra_vars_json])

            if tags:
                cmd.extend(["--tags", ",".join(tags)])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1800,  # 30 minute timeout
                cwd=str(self.repo_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "playbook": playbook_path,
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": "Ansible not found. Install with: pip install ansible",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Ansible playbook timeout (30 minutes)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Secrets Management (HashiCorp Vault)
    # ============================================

    async def vault_read_secret(
        self,
        path: str,
        vault_addr: str = "http://localhost:8200",
        vault_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Read secret from HashiCorp Vault

        Args:
            path: Secret path (e.g., "secret/data/myapp/db")
            vault_addr: Vault server address
            vault_token: Vault authentication token

        Returns:
            Dict with secret data
        """
        try:
            import requests

            headers = {}
            if vault_token:
                headers["X-Vault-Token"] = vault_token

            endpoint = f"{vault_addr}/v1/{path}"
            response = requests.get(endpoint, headers=headers, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "data": data.get("data", {}),
                }
            else:
                return {
                    "success": False,
                    "error": f"Vault returned {response.status_code}: {response.text}",
                }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def vault_write_secret(
        self,
        path: str,
        data: Dict[str, Any],
        vault_addr: str = "http://localhost:8200",
        vault_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Write secret to HashiCorp Vault

        Args:
            path: Secret path
            data: Secret data to store
            vault_addr: Vault server address
            vault_token: Vault authentication token

        Returns:
            Dict with write results
        """
        try:
            import requests

            headers = {"Content-Type": "application/json"}
            if vault_token:
                headers["X-Vault-Token"] = vault_token

            endpoint = f"{vault_addr}/v1/{path}"
            response = requests.post(endpoint, json={"data": data}, headers=headers, timeout=10)

            return {
                "success": response.status_code in [200, 204],
                "path": path,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
