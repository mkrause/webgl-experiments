
import * as React from 'react';

// Experiments
import { Experiment1 } from './experiments/Experiment1_Basic';
import { Experiment2 } from './experiments/Experiment2_Organized';
import { Experiment3 } from './experiments/Experiment3_Transforms';
import { Experiment4 } from './experiments/Experiment4_Animation';
import { Experiment5 } from './experiments/Experiment5_Declarative';
import { Experiment6 } from './experiments/Experiment6_Orthographic';
import { Experiment7 } from './experiments/Experiment7_Perspective';
import { Experiment8 } from './experiments/Experiment8_Lighting';

import './App.css';


export const App = () => {
  const renderExperiment = () => {
    const experimentNumber = Number(new URL(window.location.toString()).searchParams.get('experiment') ?? 1);
    switch (experimentNumber) {
      case 1: return <Experiment1/>;
      case 2: return <Experiment2/>;
      case 3: return <Experiment3/>;
      case 4: return <Experiment4/>;
      case 5: return <Experiment5/>;
      case 6: return <Experiment6/>;
      case 7: return <Experiment7/>;
      case 8: return <Experiment8/>;
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
