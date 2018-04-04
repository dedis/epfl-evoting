# Artillery Cothority Engine

## About

This engine allows using [Artillery.io](https://artillery.io) to load test [Cothority](https://github.com/dedis/cothority)
using the NPM library [@dedis/cothority](https://www.npmjs.com/package/@dedis/cothority)

## Usage

### Installation

```
# Assumes artillery is already installed
npm install -g artillery-engine-cothority
```

### Script Params

1. `config.target` is ignored by the engine
2. Specify the rosterFile location in `config.cothority.rosterToml` and service in `config.cothority.service`
3. Add `cothority` to `cothority.engines`
4. Use `engine: "cothority"` in your scenario

#### Example Script

```yaml
config:
  target: "http://localhost:7003"
  # Authentication Server Host
  authHost: "http://localhost:3000"
  # External javascript file
  processor: "./processor.js"
  phases:
  # 10 users per second linearly ramped up to 50 users per second within 120s
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Warm up"
  # Stress stest with 50 users per second for 300s
    - duration: 300
      arrivalRate: 50
      name: "Under load"
  cothority:
    service: "evoting"
    rosterToml: "/path/to/public.toml"
  engines:
    cothority: {}
scenarios:
  - engine: "cothority"
    name: "Ping"
    beforeScenario: "somefunction"
    flow:
      - send:
          request: "Ping"
          response: "Ping"
		  beforeRequest: "somefunction2"
          data:
            nonce: "{{ $randomNumber(1, 1000) }}"
          capture:
            - nonce
      - log: "{{ nonce }}"
```

### Run the script

```
artillery run script.yml
```

### License
[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html)
