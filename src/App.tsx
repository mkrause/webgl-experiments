
import * as React from 'react';

// Experiments
import { Experiment1 } from './basic/Experiment1_Basic';
import { Experiment2 } from './basic/Experiment2_Organized';
import { Experiment3 } from './basic/Experiment3_Transforms';

import './App.css';


export const App = () => {
  const renderExperiment = () => {
    const experimentNumber = Number(new URL(window.location.toString()).searchParams.get('experiment')) ?? 1;
    switch (experimentNumber) {
      case 1: return <Experiment1/>;
      case 2: return <Experiment2/>;
      case 3: return <Experiment3/>;
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
