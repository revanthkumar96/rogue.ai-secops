import { render } from "solid-js/web"
import { Router, Route } from "@solidjs/router"
import { App } from "./App"
import { Dashboard } from "./components/Dashboard"
import { AgentsPage } from "./pages/Agents"
import { WorkflowsPage } from "./pages/Workflows"
import { SettingsPage } from "./pages/Settings"
import { TestsPage } from "./pages/Tests"
import { DeploymentsPage } from "./pages/Deployments"
import { MonitoringPage } from "./pages/Monitoring"
import "./index.css"

const root = document.getElementById("root")

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Dashboard} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/workflows" component={WorkflowsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/tests" component={TestsPage} />
      <Route path="/deployments" component={DeploymentsPage} />
      <Route path="/monitoring" component={MonitoringPage} />
    </Router>
  ),
  root!
)
