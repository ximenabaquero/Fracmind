const API_BASE_URL = 'http://localhost:8000'

class NetworkAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  async initialize(params = {}) {
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({
        n: 80,
        k: 6,
        p: 0.1,
        ...params,
      }),
    })
  }

  async step(params = {}) {
    return this.request('/step', {
      method: 'POST',
      body: JSON.stringify({
        events: [],
        learning_rate: 0.01,
        homeostatic_threshold: 0.5,
        ...params,
      }),
    })
  }

  async getGraph() {
    return this.request('/graph')
  }

  async getStatus() {
    return this.request('/status')
  }

  async stimulateNode(nodeId, stimulus) {
    return this.request(`/stimulate/${nodeId}?stimulus=${stimulus}`, {
      method: 'POST',
    })
  }
}

export const networkAPI = new NetworkAPI()