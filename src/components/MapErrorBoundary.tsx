import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class MapErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Map component error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', alignItems: 'center', 
          justifyContent: 'center', height: '100%', color: '#00c9a7'
        }}>
          <p>Map failed to load. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
