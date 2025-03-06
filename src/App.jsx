import React, { useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { Tabs, Tab, Table, Form } from "react-bootstrap";

Chart.register(...registerables);

const strategies = ["Tit for Tat", "Always Cooperate", "Always Defect", "Random"];
const payoffMatrix = {
  "Cooperate-Cooperate": [3, 3],
  "Defect-Cooperate": [5, 0],
  "Cooperate-Defect": [0, 5],
  "Defect-Defect": [1, 1],
};

const strategyColors = {
  "Tit for Tat": "blue",
  "Always Cooperate": "green",
  "Always Defect": "red",
  "Random": "orange",
};

const getStrategyMove = (strategy, lastOpponentMove) => {
  switch (strategy) {
    case "Tit for Tat":
      return lastOpponentMove ?? "Cooperate";
    case "Always Cooperate":
      return "Cooperate";
    case "Always Defect":
      return "Defect";
    case "Random":
      return Math.random() < 0.5 ? "Cooperate" : "Defect";
    default:
      return "Cooperate";
  }
};

const App = () => {
  const [selected, setSelected] = useState(strategies);
  const [results, setResults] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [staticPairwiseData, setStaticPairwiseData] = useState([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(180);
  const [showTimer, setShowTimer] = useState(false);

  const toggleStrategy = (strategy) => {
    setSelected((prev) =>
      prev.includes(strategy) ? prev.filter((s) => s !== strategy) : [...prev, strategy]
    );
  };

  const runTournament = () => {
    setResults(null);
    setScoreHistory([]);
    setDecisionHistory([]);
    setStaticPairwiseData([]);
    setTimeLeft(180);
    setShowTimer(true);
  
    let scores = {};
    let history = [];
    let decisions = [];
    let newPairwiseData = [];
  
    selected.forEach((strat) => (scores[strat] = 0));
  
    // Ensure "Tit for Tat" always goes first in pairwise matchups
    const orderedStrategies = [
      ...selected.filter((s) => s === "Tit for Tat"),
      ...selected.filter((s) => s !== "Tit for Tat"),
    ];
  
    for (let i = 0; i < orderedStrategies.length; i++) {
      for (let j = i; j < orderedStrategies.length; j++) {
        let stratA = orderedStrategies[i];
        let stratB = orderedStrategies[j];
  
        let scoreA = 0,
          scoreB = 0;
        let lastMoveA = null,
          lastMoveB = null;
        let roundScores = { ...scores };
        let matchDecisions = [];
        let pairwiseScores = [];
  
        for (let round = 0; round < 200; round++) {
          let moveA = getStrategyMove(stratA, lastMoveB);
          let moveB = getStrategyMove(stratB, lastMoveA);
          let [payoffA, payoffB] = payoffMatrix[`${moveA}-${moveB}`];
          scoreA += payoffA;
          scoreB += payoffB;
          lastMoveA = moveA;
          lastMoveB = moveB;
  
          roundScores[stratA] = (roundScores[stratA] || 0) + payoffA;
          roundScores[stratB] = (roundScores[stratB] || 0) + payoffB;
          history.push({ ...roundScores });
          matchDecisions.push({ round, stratA, moveA, stratB, moveB });
          pairwiseScores.push({ round, scoreA, scoreB });
        }
  
        scores[stratA] += scoreA;
        scores[stratB] += scoreB;
        decisions.push(matchDecisions);
        newPairwiseData.push({
          stratA,
          stratB,
          scores: pairwiseScores,
          finalA: scoreA,
          finalB: scoreB,
        });
      }
    }
  
    setStaticPairwiseData(newPairwiseData);
    setResults(scores);
    setScoreHistory(history);
    setDecisionHistory(decisions);
  };
  

  useEffect(() => {
    if (timeLeft === 0 || !showTimer) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, showTimer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const pairwiseGraphData = useMemo(() => {
    return staticPairwiseData.map(({ stratA, stratB, scores, finalA, finalB }, index) => (
      <div key={index} className="col-md-6 mb-4">
        <h5>{stratA} vs {stratB}</h5>
        <div style={{ height: "250px" }}>
          <Line
            data={{
              labels: scores.map((_, i) => i + 1),
              datasets: [
                {
                  label: stratA,
                  data: scores.map((s) => s.scoreA),
                  borderColor: strategyColors[stratA],
                  fill: false,
                },
                {
                  label: stratB,
                  data: scores.map((s) => s.scoreB),
                  borderColor: strategyColors[stratB],
                  fill: false,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
            }}
          />
        </div>
        <table className="table table-bordered mt-2">
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Final Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{stratA}</td>
              <td>{finalA}</td>
            </tr>
            <tr>
              <td>{stratB}</td>
              <td>{finalB}</td>
            </tr>
          </tbody>
        </table>
      </div>
    ));
  }, [staticPairwiseData]);

  return (
    <div className="position-absolute top-0 start-0" style={{ marginLeft: "10vw", marginTop: "3vw", marginRight: "15vw" }}>
      {showTimer && (
        <div style={{ position: "absolute", top: "0", right: "0", fontSize: "24px", fontWeight: "bold" }}>
          {formatTime(timeLeft)}
        </div>
      )}
      <h1>Modeling Generosity: Why It Pays to Be Kind</h1>
      <h3 className="text-muted">
        <em>PSYC 37 Final Project</em>
      </h3>
      <h5 className="text-muted">Chelsea Joe<br />Professor O'Neill</h5>

    
      <Tabs defaultActiveKey="overview" className="mt-3">
        <Tab eventKey="overview" title="General Overview">

        <br></br>
        <div class="prisoners-dilemma">
        <h2>Prisoner's Dilemma</h2>
        <p><strong>You and your friend robbed a bank and were caught. The police have decided to interrogate you separately.</strong></p>
        <p>The police want both of you to betray each other, and they ask you if your friend was involved in the robbery.</p>
        <p><em>You and your friend can either choose to confess or defect...</em></p>
        <p><strong>What do you do?</strong></p>
      </div>





      <br></br>
        <h3>Payoff Matrix</h3>
        

<table style={{ 
  width: "350px", 
  height: "300px", 
  borderCollapse: "collapse", 
  textAlign: "center", 
  border: "2px solid black" 
}}>
  <tr>
    <th style={{ border: "1px solid black", padding: "10px" }}></th>
    <th style={{ border: "1px solid black", padding: "10px" }}>Opponent Cooperates</th>
    <th style={{ border: "1px solid black", padding: "10px" }}>Opponent Defects</th>
  </tr>
  <tr>
    <th style={{ border: "1px solid black", padding: "10px" }}>You Cooperate</th>
    <td style={{ border: "1px solid black", width: "150px", height: "120px", fontSize: "24px" }}>
      <span style={{ color: "blue", fontWeight: "bold" }}>1</span>, 
      <span style={{ color: "red", fontWeight: "bold" }}>1</span>
    </td>
    <td style={{ border: "1px solid black", width: "150px", height: "120px", fontSize: "24px" }}>
      <span style={{ color: "blue", fontWeight: "bold" }}>5</span>, 
      <span style={{ color: "red", fontWeight: "bold" }}>0</span>
    </td>
  </tr>
  <tr>
    <th style={{ border: "1px solid black", padding: "10px" }}>You Defect</th>
    <td style={{ border: "1px solid black", width: "150px", height: "120px", fontSize: "24px" }}>
      <span style={{ color: "blue", fontWeight: "bold" }}>0</span>, 
      <span style={{ color: "red", fontWeight: "bold" }}>5</span>
    </td>
    <td style={{ 
        border: "2px solid black", 
        width: "150px", 
        height: "120px", 
        fontSize: "24px", 
        borderRadius: "50%", 
        border: "4px solid black" 
      }}>
      <span style={{ color: "blue", fontWeight: "bold" }}>3</span>, 
      <span style={{ color: "red", fontWeight: "bold" }}>3</span>
    </td>
  </tr>
</table>

<br></br>

<div class="nash-equilibrium">
  <h3>Nash Equilibrium (Mathematical Explanation)</h3>
  <p><strong>The best choice for both players is to defect.</strong></p>
  <p><strong>Why?</strong></p>
  <p>Let's look at the situation from your friend's perspective:</p>
  <ul>
    <li>If your friend chooses to defect, your best option is to defect too, so that you both get 3 years, instead of you serving 5 years and your friend serving none.</li>
    <li>If your friend chooses to cooperate, your best option (from a mathematical standpoint) is to defect, so that you serve no time at all.</li>
  </ul>
  <p><strong>Therefore, the best option for both players is to defect.</strong></p>
</div>

    
<div class="iterated-prisoners-dilemma">
  <h2>Iterated Prisoner's Dilemma</h2>
  <div class="ipd-description">
    <p><strong>The Iterated Prisoner's Dilemma (IPD)</strong> is a repeated version of the original Prisoner’s Dilemma.</p>
    <p>In this game, the players make decisions repeatedly, allowing for a long-term relationship between them.</p>
    <p>If it were a one-off choice, it would be much easier to defect and forget. However, with repeated interactions, the choices you make now impact future outcomes.</p>
  </div>
</div>


<div class="strategies">
  <h3>Strategies</h3>

  <div class="strategy">
    <h4>1. Tit for Tat</h4>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Strategy:</strong> Starts with cooperation, then copies the opponent’s last move.</p>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Effect:</strong> Rewards cooperation, punishes defection.</p>
  </div>

  <div class="strategy">
    <h4>2. Always Cooperate</h4>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Strategy:</strong> Always chooses to cooperate.</p>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Effect:</strong> Promotes trust but is easily exploited.</p>
  </div>

  <div class="strategy">
    <h4>3. Always Defect</h4>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Strategy:</strong> Always chooses to defect.</p>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Effect:</strong> Gains short-term benefits but leads to loss of trust.</p>
  </div>

  <div class="strategy">
    <h4>4. Random</h4>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Strategy:</strong> Randomly chooses to cooperate or defect.</p>
    <p><strong> &nbsp;&nbsp;&nbsp;&nbsp; Effect:</strong> Unpredictable, partner cannot trust you.</p>
  </div>
</div>




        </Tab>
        <Tab eventKey="simulation" title="Simulation">
          <h3>Simulation</h3>


      <h3 className="mt-5">Select Strategies</h3>
      {strategies.map((strategy) => (
        <div key={strategy} className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={selected.includes(strategy)}
            onChange={() => toggleStrategy(strategy)}
          />
          <label className="form-check-label">{strategy}</label>
        </div>      
      ))}
        <button className="btn btn-primary mt-3" onClick={runTournament}>Run Tournament</button>

      {results && (
    <div className="mt-4">
      <h3>Overall Score Progression</h3>
      <Line
        data={{
          labels: Array.from({ length: scoreHistory.length }, (_, i) => i + 1),
          datasets: selected.map((strategy) => ({
            label: strategy,
            data: scoreHistory.map((score) => score[strategy] || 0),
            borderColor: strategyColors[strategy],
            fill: false,
          })),
        }}
      />
      <table className="table table-bordered mt-2">
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(results).map(([strategy, score]) => (
            <tr key={strategy}>
              <td>{strategy}</td>
              <td>{score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
      {staticPairwiseData.length > 0 && (
        <div className="mt-4">
          <h3>Pairwise Score Progression</h3>
          <div className="row">{pairwiseGraphData}</div>
        </div>
      )}
    </Tab>

    
    <Tab eventKey="research" title="Research Question">
  <div className="content">
    <h1>Main Argument</h1>
    <p>The key to a happy and successful life lies in generosity, which builds trust, and forgiveness, which sustains relationships through cooperation.</p>

    <p>I wanted to focus my commentary on the positive rather than the negative. In the Prisoner’s Dilemma, Tit for Tat prevents exploitation by remembering an opponent’s last move and defecting if betrayed. Instead of focusing on its retaliative nature, I want to emphasize the neuroscience and the benefits behind its forgiveness, and trust with other cooperative strategies.</p>

    <h2>Generosity and Trust</h2>
    <p>Violations of trust activate social cognitive-related brain areas, specifically the default mode network [1]. This means that when trust is broken, the brain processes it as a social threat, making future cooperation less likely. Trust activates the paracingulate cortex, which helps in predicting others’ intentions and maintaining relationships. The septal area, associated with social attachment, is selectively activated in unconditional trust (trust given without requiring immediate reciprocation) [2].</p>

    <p>When building a relationship, partners must infer each other’s intentions to determine mutual trust and reciprocity. Generosity, or acts of goodwill, counteract trust violations by signaling trustworthiness without the expectation of reciprocation.</p>

    <h2>Forgiveness and Emotional Well-Being</h2>
    <p>Forgiveness mediates the relationship between the middle frontal gyrus volume and both depressive and anxiety symptom levels in adolescents. Those with a greater capacity for forgiveness had lower depression and anxiety levels, suggesting that forgiveness is not only altruistic but also beneficial for long-term emotional well-being [3].</p>

    <p>As an evolutionary strategy, forgiveness helps assess whether maintaining relationships is worthwhile [4]. While vengeance activates reward-based brain areas, forgiveness engages the prefrontal cortex to inhibit revenge impulses, showing that forgiveness is an active, strategic choice. Three cognitive mechanisms facilitate forgiveness [5]:</p>

    <ul>
      <li><strong>Cognitive control:</strong> Suppressing negative emotions</li>
      <li><strong>Perspective-taking:</strong> Understanding the offender</li>
      <li><strong>Social valuation:</strong> Prioritizing future relationship benefits</li>
    </ul>

    <h2>References</h2>
    <ol>
      <li className="citation">van der Werff, L., O’Shea, D., Healy, G., Buckley, F., Real, C., Keane, M., & Lynn, T. (2023). The neuroscience of trust violation: Differential activation of the default mode network in ability, benevolence, and integrity breaches. Applied Psychology., 72(4), 1392–1408. <a href="https://doi.org/10.1111/apps.12437" target="_blank">https://doi.org/10.1111/apps.12437</a></li>
      <li className="citation">Krueger, F., McCabe, K., Moll, J., Kriegeskorte, N., Zahn, R., Strenziok, M., Heinecke, A., & Grafman, J. (2007). Neural correlates of trust. Proceedings of the National Academy of Sciences, 104(50), 20084–20089. <a href="https://doi.org/10.1073/pnas.0710103104" target="_blank">https://doi.org/10.1073/pnas.0710103104</a></li>
      <li className="citation">Schuttenberg, E. M., Sneider, J. T., Rosmarin, D. H., Cohen-Gilbert, J. E., Oot, E. N., Seraikas, A. M., Stein, E. R., Maksimovskiy, A. L., Harris, S. K., & Silveri, M. M. (2022). Forgiveness Mediates the Relationship Between Middle Frontal Gyrus Volume and Clinical Symptoms in Adolescents. Frontiers in human neuroscience, 16, 782893. <a href="https://doi.org/10.3389/fnhum.2022.782893" target="_blank">https://doi.org/10.3389/fnhum.2022.782893</a></li>
      <li className="citation">Billingsley, J., & Losin, E. A. R. (2017). The Neural Systems of Forgiveness: An Evolutionary Psychological Perspective. Frontiers in psychology, 8, 737. <a href="https://doi.org/10.3389/fpsyg.2017.00737" target="_blank">https://doi.org/10.3389/fpsyg.2017.00737</a></li>
      <li className="citation">Fourie, M. M., Hortensius, R., & Decety, J. (2020). Parsing the components of forgiveness: Psychological and neural mechanisms. Neuroscience & Biobehavioral Reviews, 112, 437–451. <a href="https://doi.org/10.1016/j.neubiorev.2020.02.020" target="_blank">https://doi.org/10.1016/j.neubiorev.2020.02.020</a></li>
    </ol>
  </div>
</Tab>

    </Tabs>
    </div>
    
  );
};

export default App;
