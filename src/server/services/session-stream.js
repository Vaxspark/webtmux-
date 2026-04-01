export function mapControlAction(action) {
  switch (action) {
    case 'enter':
      return ['Enter'];
    case 'ctrl-c':
      return ['C-c'];
    case 'esc':
      return ['Escape'];
    default:
      throw new Error(`Unsupported control action: ${action}`);
  }
}
