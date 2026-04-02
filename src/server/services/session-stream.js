export function mapControlAction(action) {
  switch (action) {
    case 'enter':
      return ['Enter'];
    case 'ctrl-c':
      return ['C-c'];
    case 'esc':
      return ['Escape'];
    case 'up':
      return ['Up'];
    case 'down':
      return ['Down'];
    case 'tab':
      return ['Tab'];
    default:
      throw new Error(`Unsupported control action: ${action}`);
  }
}
