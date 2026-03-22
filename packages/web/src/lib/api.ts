/**
 * API client for Rouge backend
 */

const API_BASE = "/api"

export interface Agent {
  name: string
  description: string
}

export interface AgentExecuteRequest {
  type: string
  task: string
  context?: Record<string, any>
  stream?: boolean
}

export interface AgentExecuteResponse {
  type: string
  output: string
  success: boolean
  metadata?: Record<string, any>
}

export interface Workflow {
  id: string
  name: string
  description?: string
  status: string
  steps: any[]
  created_at: number
  updated_at: number
}

export interface TestRun {
  id: string
  name: string
  status: string
  duration_ms?: number
  created_at: number
}

export interface Deployment {
  id: string
  environment: string
  version: string
  status: string
  started_at: number
  completed_at?: number
}

export interface Config {
  ollama: {
    url: string
    model: string
    timeout: number
  }
  agents: {
    default: string
    enabled: string[]
    maxConcurrent: number
  }
  workflows: {
    parallel: boolean
    timeout: number
    retries: number
  }
  permissions: {
    deploy: string
    test: string
    bash: string
  }
  workspace?: string
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  // Health
  async health() {
    return this.request<{ status: string; timestamp: number }>("/health")
  }

  // Agents
  async listAgents() {
    return this.request<{ agents: string[] }>("/agent")
  }

  async getAgentCapabilities(type: string) {
    return this.request<Agent>(`/agent/${type}`)
  }

  async executeAgent(request: AgentExecuteRequest) {
    return this.request<AgentExecuteResponse>("/agent/execute", {
      method: "POST",
      body: JSON.stringify(request),
    })
  }

  async testAgentConnection() {
    return this.request<{ connected: boolean; provider: string }>(
      "/agent/test/connection"
    )
  }

  // Workflows
  async listWorkflows() {
    return this.request<{ workflows: Workflow[]; total: number }>("/workflow")
  }

  async getWorkflow(id: string) {
    return this.request<Workflow>(`/workflow/${id}`)
  }

  async createWorkflow(data: {
    name: string
    description?: string
    steps: any[]
  }) {
    return this.request<Workflow>("/workflow", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async executeWorkflow(id: string) {
    return this.request<{ id: string; status: string; started_at: number }>(
      `/workflow/${id}/execute`,
      { method: "POST" }
    )
  }

  // Tests
  async listTests() {
    return this.request<{ tests: TestRun[]; total: number }>("/test")
  }

  async getTest(id: string) {
    return this.request<TestRun>(`/test/${id}`)
  }

  async executeTests(data: { pattern?: string; coverage?: boolean }) {
    return this.request<TestRun>("/test/execute", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Deployments
  async listDeployments() {
    return this.request<{ deployments: Deployment[]; total: number }>(
      "/deploy"
    )
  }

  async getDeployment(id: string) {
    return this.request<Deployment>(`/deploy/${id}`)
  }

  async validateDeployment(data: {
    environment: string
    config: Record<string, any>
  }) {
    return this.request<{ valid: boolean }>("/deploy/validate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async executeDeployment(data: { environment: string; version: string }) {
    return this.request<Deployment>("/deploy/execute", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Config
  async getConfig() {
    return this.request<Config>("/config")
  }

  async updateConfig(config: Partial<Config>) {
    return this.request<Config>("/config", {
      method: "PATCH",
      body: JSON.stringify(config),
    })
  }

  async listFiles(path?: string) {
    const url = path ? `/files/list?path=${encodeURIComponent(path)}` : "/files/list"
    return this.request<{ path: string; folders: string[] }>(url)
  }
}

export const api = new ApiClient()
