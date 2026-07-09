export default function TemplatePluginDashboard({ pluginId, api }) {
  return `Template dashboard loaded for ${pluginId}. Service controls are available from the plugin card, and this component can call api.getServiceStatus/startService/stopService/restartService when needed.`;
}

