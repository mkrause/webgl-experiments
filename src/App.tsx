
import * as React from 'react';

// Experiments
import { Experiment1 } from './experiments/Experiment1_Basic';
import { Experiment2 } from './experiments/Experiment2_Organized';
import { Experiment3 } from './experiments/Experiment3_Transforms';
import { Experiment4 } from './experiments/Experiment4_Animation';
import { Experiment5 } from './experiments/Experiment5_Declarative';

import './App.css';


export const App = () => {
  const renderExperiment = () => {
    const experimentNumber = Number(new URL(window.location.toString()).searchParams.get('experiment')) ?? 1;
    switch (experimentNumber) {
      case 1: return <Experiment1/>;
      case 2: return <Experiment2/>;
      case 3: return <Experiment3/>;
      case 4: return <Experiment4/>;
      case 5: return <Experiment5/>;
      default: return 'Unknown experiment';
    }
  };
  return (
    <div className="App">
      {renderExperiment()}
    </div>
  );
};

export default App;
