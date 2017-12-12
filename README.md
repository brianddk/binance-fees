# binance-fees

```
LTC: LQjSwZLigtgqHA3rE14yeRNbNNY2r3tXcA
```
A simple nodejs program to generate a report showing the smallest possible purchases.  Since Binance does not allow partial lots, there is often **dust** left in counter currencies after purchases or sales.  This will calculate the minimum lot cost on the various exchanges to give you an idea what can be bought with that dust.  It will also calculate the **exit tax** required to move the various coins off of binance.

## Getting Started

You'll need a desktop system with command console.  I'm using nodejs version **5.11.0** so if your using a later version, I recommend installing **nvm** to run other versions in parallel.

### Prerequisites

Ensure that you are running nodejs version 5.11.0

```
node -v
```

If you have `nvm` installed you can activate version 5.11.0

```
nvm use 5.11.0
```

### Installing

Obtain the repository using git

```
git clone https://github.com/brianddk/binance-fees.git
```

Once you are on a good nodejs version, a simple `npm install` will suffice

```
npm install
```

This should be all that is required and you can no generate a report.

### Running

To run the report simply run `node binance-fees.js`

```
node binance-fees.js > report.csv
```

The output of the report will be a CSV file viewable by your favorite spreadsheet.

## Built With

* [Node.js](https://nodejs.org/en/) - The NodeJS language runtime
* [npm](https://www.npmjs.com/) - NodeJS package manager
* [nvm-windows](https://github.com/coreybutler/nvm-windows) - nvm for Windows, but there are many releases for other OSes too.

## Contributing

Just issue a PR on github.

## Issues

Just submit an issue on github.

## Authors

* **brianddk** - *Initial work* - [Github](https://github.com/brianddk) - Tips [LTC]: LQjSwZLigtgqHA3rE14yeRNbNNY2r3tXcA

## License

This project is licensed under the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) License.

## Acknowledgments

* Thanks to [Binance](https://www.binance.com/) for providing an API
