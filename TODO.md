* Models should be immutable, aggregating state should create new model instances instead of updating existing models
* Model code should not contain server specific dependencies so they (and the state changing code) can be used in the frontend
