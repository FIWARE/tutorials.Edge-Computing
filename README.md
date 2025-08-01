[![FIWARE Banner](https://fiware.github.io/tutorials.Edge-Computing/img/fiware.png)](https://www.fiware.org/developers)

[![FIWARE Context processing, analysis and visualisation](https://nexus.lab.fiware.org/static/badges/chapters/processing.svg)](https://github.com/FIWARE/catalogue/blob/master/processing/README.md)

These tutorials are an introduction to [FIWARE FogFlow](https://fogflow.readthedocs.io/en/latest/) which allows its users
to dynamically orchestrate the processing flows on edges. It explains how to enable FogFlow on a distributed or a single
node system, register user defined workload patterns and orchestrate them on the edges in the form of running tasks. For
better understanding, examples have been included in the tutorial.

# Start-Up

## NGSI-v2 Smart Supermarket

**NGSI-v2** offers JSON based interoperability used in individual Smart Systems. To run this tutorial with **NGSI-v2**, use the `NGSI-v2` branch.

```console
git clone https://github.com/FIWARE/tutorials.Edge-Computing.git
cd tutorials.Edge-Computing
git checkout NGSI-v2

./services create
./services start
```

<!--
| [![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/) | :books: [Documentation](https://github.com/FIWARE/tutorials.Edge-Computing/tree/NGSI-v2) | <img src="https://cdn.jsdelivr.net/npm/simple-icons@v3/icons/postman.svg" height="15" width="15"> [Postman Collection](https://fiware.github.io/tutorials.Edge-Computing/) |
| --- | --- | --- |
-->

| [![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/) | :books: [Documentation](https://github.com/FIWARE/tutorials.Edge-Computing/tree/NGSI-LD) |
| --- | --- |

## NGSI-LD Smart Farm

**NGSI-LD** offers JSON-LD based interoperability used for Federations and Data Spaces. To run this tutorial with **NGSI-LD**, use the `NGSI-LD` branch.

```console
git clone https://github.com/FIWARE/tutorials.Edge-Computing.git
cd tutorials.Edge-Computing
git checkout NGSI-LD

./services create
./services start
```
<!--
| [![NGSI LD](https://img.shields.io/badge/NGSI-LD-d6604d.svg)](https://cim.etsi.org/NGSI-LD/official/0--1.html) | :books: [Documentation](https://github.com/FIWARE/tutorials.Edge-Computing/tree/NGSI-LD) | <img  src="https://cdn.jsdelivr.net/npm/simple-icons@v3/icons/postman.svg" height="15" width="15"> [Postman Collection](https://fiware.github.io/tutorials.Edge-Computing/ngsi-ld.html) |
| --- | --- | --- |
-->

| [![NGSI LD](https://img.shields.io/badge/NGSI-LD-d6604d.svg)](https://cim.etsi.org/NGSI-LD/official/0--1.html) | :books: [Documentation](https://github.com/FIWARE/tutorials.Edge-Computing/tree/NGSI-LD) |
| --- | --- | 


---

## License

[MIT](LICENSE) © 2020-2024 FIWARE Foundation e.V.
