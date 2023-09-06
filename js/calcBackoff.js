document.addEventListener("DOMContentLoaded", () => {

    // button to change the weightInputs on the go
    const kgButton = document.getElementById("kg-button");
    const poundButton = document.getElementById("pound-button");
    
    //inputs for backoff calculation itself
    const workingWeightInput = document.getElementById("working-weight");
    const workingRepsInput = document.getElementById("working-reps");
    const workingRPEInput = document.getElementById("working-rpe");
    const backOffRepsInput = document.getElementById("desired-reps");
    const backoffDesiredRPEInput = document.getElementById("desired-rpe");

    const resultField = document.getElementById("weight-span"); //result field:


    let unit = localStorage.getItem("unit") === "pounds" ? "pounds" : "kg";

    // find out which button is currently displayed on which button is not show the saved on in localStorage initally:
    // if no mode is set kg is the fallback mode:
    const initalUnitButton = unit === "pounds" ? poundButton : kgButton;
    const notInitialButton = initalUnitButton === kgButton ? poundButton : kgButton;

    switchButtonView(initalUnitButton, notInitialButton);


    kgButton.addEventListener("click", e => {
      e.preventDefault();
      unit = "pounds";

      localStorage.setItem("unit", unit);

      switchButtonView(poundButton, kgButton);
      calculateToDifferentUnit(unit);
    })

    poundButton.addEventListener("click", e => {
      e.preventDefault();
      unit = "kg";

      localStorage.setItem("unit", unit);

      switchButtonView(kgButton, poundButton);
      calculateToDifferentUnit(unit);

      console.log("Ist der LocalS")
    })

    function calculateToDifferentUnit(unit) {
      if (unit === "kg") {
        workingWeightInput.value = workingWeightInput.value * 0.453592;        

      } else if (unit === "pounds") {
        workingWeightInput.value = workingWeightInput.value * 2.2;
      } else {
        console.warn("unit is not defined");
      }

      workingWeightInput.value = Math.ceil(workingWeightInput.value / 2.5) * 2.5;
      workingWeightInput.dispatchEvent(new Event("change"));
    }
  
    // eventlistener for all inputs if all are !undefined the calculation is made
    workingWeightInput.addEventListener("change", calcBackoff);
    workingRepsInput.addEventListener("change", calcBackoff);
    workingRPEInput.addEventListener("change", calcBackoff);
    backOffRepsInput.addEventListener("change", calcBackoff);
    backoffDesiredRPEInput.addEventListener("change", calcBackoff);


    function calcBackoff() {
      //all off these values have to be defined otherwise return
      if (!workingWeightInput.value
          || !workingRepsInput.value 
          || !workingRPEInput.value 
          || !backOffRepsInput.value
          || !backoffDesiredRPEInput.value) {
            return;
          }

      //calculation max through working set:
      const weight = workingWeightInput.value;
      const reps = workingRepsInput.value;
      const rpe = workingRPEInput.value;
       const estMax = calcMax(weight, reps, rpe);
  
      const backOffReps = backOffRepsInput.value;
      const desiredRPE = backoffDesiredRPEInput.value;
      const totalBackoffReps = parseInt(backOffReps) + parseInt(10 - desiredRPE);

      // calculating percentage through regression formula
      let percentage =
      (0.484472 * totalBackoffReps * totalBackoffReps -
        33.891 * totalBackoffReps +
        1023.67) *
      0.001;

      let result = estMax * percentage;
      let roundedResult = Math.ceil(result / 2.5) * 2.5;
  
      if (isNaN(roundedResult)) {
        resultField.value = "";
        return;
      }
  
      // gives a range of weight recommandations the user can decide to use:
      let weightSpanLow = roundedResult - 5;
      let weightSpanHigh = roundedResult + 5;
      let resultString = weightSpanLow + " - " + weightSpanHigh;
  
      resultField.value = resultString;

    }

    // calculates estimated Reps based on formula
    function calcMax(weight, reps, rpe) {
      actualReps = parseInt(reps) + parseInt(10 - rpe);
      const unroundedValue = weight * (1 + 0.0333 * actualReps); 
      const roundedValue = Math.ceil(unroundedValue / 2.5) * 2.5;
      return roundedValue;
    } 


    //shows one button and hides the other:
    function switchButtonView(displayButton, hideButton) {
      displayButton.removeAttribute("hidden");
      hideButton.setAttribute("hidden", true);
    }


    /*Validatin RPE INPUTS */
    workingRPEInput.addEventListener("change", () => {
      let rpe = workingSetRPE.value;
  
      if (rpe < 5) {
        workingSetRPE.value = 5;
      } else if (rpe > 10) {
        workingSetRPE.value = 10;
      }
    });
  
    backoffDesiredRPEInput.addEventListener("change", () => {
      let rpe = desiredRPE.value;
  
      if (rpe < 5) {
        desiredRPE.value = 5;
      } else if (rpe > 10) {
        desiredRPE.value = 10;
      }
    });

  });
  