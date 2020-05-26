[![FIWARE Banner](https://fiware.github.io/tutorials.Edge-Computing/img/fiware.png)](https://www.fiware.org/developers)

[![FIWARE Context processing, analysis and visualisation](https://nexus.lab.fiware.org/static/badges/chapters/processing.svg)](https://github.com/FIWARE/catalogue/blob/master/processing/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

Este es un tutorial introductorio para [FIWARE FogFlow](https://fogflow.readthedocs.io/en/latest/) que permite a sus
usuarios para orquestar dinámicamente los flujos de procesamiento en los bordes. Explica cómo habilitar el FogFlow en
una sistema de nodos, registrar los patrones de carga de trabajo definidos por el usuario y orquestarlos en los bordes
en forma de tareas de ejecución. Para mejor comprensión, se han incluido ejemplos en el tutorial.

## Contenido

<details>
<summary><strong>Detalles</strong></summary>

-   [Arquitectura](#arquitectura)
    -   [Arquitectura de capas](#arquitectura-de-capas)
-   [Start Up](#start-up)
    -   [Nodo de nubes FogFlow](#nodo-de-nubes-fogflow)
    -   [Nodo FogFlow Edge](#nodo-fogflow-edge)
-   [Conectar los dispositivos de IO a FogFlow](#conectar-los-dispositivos-de-io-a-fogflow)
-   [Orquestación dinámica en los bordes usando FogFlow](#orquestacion-dinamica-en-los-bordes-usando-fogflow)
    -   [Define and trigger a Fog Function](#define-and-trigger-a-fog-function)
        -   [Register the Task Operators](#register-the-task-operators)
        -   [Definir una función de niebla "dummy"](#definir-una-funcion-de-niebla-dummy)
        -   [Desencadenar la función de niebla "dummy"](#desencadenar-la-funcion-de-niebla-dummy)
    -   [Definir y activar una topología de servicio](#definir-y-activar-una-topologia-de-servicio)
        -   [Implementar las funciones del operador](#implementar-las-funciones-del-operador)
        -   [Especifique la topología del servicio](#especifique-la-topologia-del-servicio)
        -   [Activar la topología de servicio mediante el envío de una intención](#activar-la-topologia-de-servicio-mediante-el-envio-de-una-intencion)

</details>

# Computación en el borde de la nube

La intención del tutorial es enseñar a sus usuarios cómo los dispositivos de sensores de IO envían datos de contexto a
FogFlow, cuando y donde FogFlow inicia un flujo de procesamiento para alterar el ambiente a través de dispositivos
actuadores. La siguiente figura muestra un visión general del escenario. Los sensores, los actuadores y los flujos de
procesamiento dinámico se explican en las secciones de seguimiento en este tutorial, que se relacionan con la figura de
abajo.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fogflow-overall-view.png)

1.  El usuario proporciona su escenario a FogFlow, que incluye qué hacer, cuándo hacer. FogFlow averiguará dónde hacer.
2.  Los sensores envían regularmente datos de contexto a FogFlow. Los datos pueden incluir datos ambientales como la
    temperatura, el video streaming, imágenes, etc.
3.  FogFlow orquesta los flujos de procesamiento en los bordes en poco tiempo. Estos flujos de procesamiento pueden
    cambiar el estado de un o publicar algunos datos en FogFlow, se trata de lo que el usuario quiere hacer.

Material adicional para entender los conocimientos del desarrollador, visite
[Tutorial de FogFlow](https://fogflow.readthedocs.io/en/latest/introduction.html). FogFlow también puede ser integrado
con otros GEs de FIWARE.

-   [Integrar FogFlow con Scorpio Broker](https://fogflow.readthedocs.io/en/latest/scorpioIntegration.html)
-   [Integrar FogFlow con QuantumLeap](https://fogflow.readthedocs.io/en/latest/QuantumLeapIntegration.html)
-   [Integrar FogFlow con WireCloud](https://fogflow.readthedocs.io/en/latest/wirecloudIntegration.html)

<hr class="processing"/>

# Arquitectura

El marco de FogFlow funciona con una infraestructura de TIC geo-distribuida, jerárquica y heterogénea que incluye nodos
de nube, nodos de borde y dispositivos de IO. La siguiente figura ilustra la arquitectura del sistema de FogFlow y su
componentes principales a través de tres capas lógicas.

![](https://fiware.github.io/tutorials.Edge-Computing/img/architecture.png)

## Arquitectura de capas

Lógicamente, FogFlow consiste en las siguientes tres capas:

-   **gestión de servicios:** convierte los requisitos de servicio en un plan de ejecución concreto y luego despliega el
    plan de ejecución sobre las nubes y los bordes. Los servicios de Diseñador de Tareas, Maestro de Topología y
    Registro de Dockers juntos componen la capa de gestión de servicios.
-   **gestión de contexto:** gestiona toda la información de contexto y la hace descubrible y accesible mediante una
    consulta flexible y suscribirse a las interfaces. Esta capa consiste en Corredores de Contexto y el Descubrimiento
    de IO.
-   **procesamiento de datos:** lanza tareas de procesamiento de datos y establece flujos de datos entre las tareas a
    través del pub/sub interfaces proporcionadas por la capa de gestión del contexto. Los trabajadores de borde (y por
    supuesto el trabajador de la nube) están bajo esta capa.

# Start Up

Antes de comenzar, debe asegurarse de que ha obtenido o construido las imágenes necesarias de Docker localmente. Por
favor, clone el y crear las imágenes necesarias ejecutando los comandos como se muestra:

```bash
git clone https://github.com/FIWARE/tutorials.Edge-Computing.git
cd tutorials.Edge-Computing

./services create
```

A partir de entonces, todos los servicios pueden ser inicializados desde la línea de comandos ejecutando el
[servicios](https://github.com/FIWARE/tutorials.Edge-Computing/blob/master/services) El guión Bash proporcionado dentro
de la repositorio:

```bash
./services start
```

## Nodo de nubes FogFlow

**Los requisitos previos** para poner en marcha un nodo de nubes son los siguientes:

-   **Docker:** Por favor, refiérase...
    [esto](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04) para
    instalación, versión requerida > 18.03.1-ce;
-   **Docker-Compose:** Por favor, refiérase...
    [esto](https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04) para
    instalación, versión necesaria > 2.4.2;

> **Importante:** Por favor, también permita a su usuario ejecutar los comandos del Docker sin sudo.

**Para iniciar la instalación de los servicios de nubes de FogFlow, haga lo siguiente:**

1.  Cambie las siguientes direcciones IP en config.json de acuerdo con el entorno actual.

    -   **coreservice_ip**: dirección IP pública del nodo de nubes FogFlow.
    -   **external_hostip**: dirección IP pública del actual nodo de la nube/borde;
    -   **internal_hostip**: La dirección IP de la interfaz de la red "docker0" en el nodo actual.
    -   **site_id**: una identificación única basada en una cadena para identificar el nodo en el sistema FogFlow;
    -   **physical_location**: la geo-localización del nodo;

```json
{
    "coreservice_ip": "10.156.0.9",
    "external_hostip": "10.156.0.9",
    "internal_hostip": "172.17.0.1",
    "physical_location": {
        "longitude": 139.709059,
        "latitude": 35.692221
    },
    "site_id": "001"
}
```

2.  Saque las imágenes de los componentes de FogFlow y póngalas en marcha.

```console
  docker-compose pull
  docker-compose up -d
```

3.  Validar la configuración del nodo de nubes de FogFlow a través de cualquiera de estas dos formas:

-   Comprobar si todos los contenedores están en funcionamiento usando `docker ps -a`.

```console
  docker ps -a
```

```text
  CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                                   NAMES
  90868b310608        nginx:latest        "nginx -g 'daemon of…"   5 seconds ago       Up 3 seconds        0.0.0.0:80->80/tcp                                      fogflow_nginx_1
  d4fd1aee2655        fogflow/worker      "/worker"                6 seconds ago       Up 2 seconds                                                                fogflow_cloud_worker_1
  428e69bf5998        fogflow/master      "/master"                6 seconds ago       Up 4 seconds        0.0.0.0:1060->1060/tcp                                  fogflow_master_1
  9da1124a43b4        fogflow/designer    "node main.js"           7 seconds ago       Up 5 seconds        0.0.0.0:1030->1030/tcp, 0.0.0.0:8080->8080/tcp          fogflow_designer_1
  bb8e25e5a75d        fogflow/broker      "/broker"                9 seconds ago       Up 7 seconds        0.0.0.0:8070->8070/tcp                                  fogflow_cloud_broker_1
  7f3ce330c204        rabbitmq:3          "docker-entrypoint.s…"   10 seconds ago      Up 6 seconds        4369/tcp, 5671/tcp, 25672/tcp, 0.0.0.0:5672->5672/tcp   fogflow_rabbitmq_1
  9e95c55a1eb7        fogflow/discovery   "/discovery"             10 seconds ago      Up 8 seconds        0.0.0.0:8090->8090/tcp                                  fogflow_discovery_1
```

-   Comprueba el estado del sistema desde el FogFlow DashBoard en `http://<coreservice_ip>/index.html`. La página web
    que se mostrará se muestra en la siguiente figura.

![](https://fiware.github.io/tutorials.Edge-Computing/img/dashboard.png)

## Nodo FogFlow Edge

**Los requisitos previos** para poner en marcha un nodo de borde son los siguientes:

-   **Docker:** Por favor, refiérase a
    [Instalar Docker CE en Raspberry Pi](https://withblue.ink/2019/07/13/yes-you-can-run-docker-on-raspbian.html).

**Para iniciar la instalación, haga lo siguiente:**

1.  Cambiar el archivo de configuración similar al nodo de la nube, pero ahora coreservice_ip se mantendrá uniforme
    porque es la dirección IP del nodo de la nube.

```json
{
    "coreservice_ip": "10.156.0.9",
    "external_hostip": "10.156.0.10",
    "internal_hostip": "172.17.0.1",
    "physical_location": {
        "longitude": 138.709059,
        "latitude": 36.692221
    },
    "site_id": "002",

    "worker": {
        "container_autoremove": false,
        "start_actual_task": true,
        "capacity": 4
    }
}
```

2.  Inicie el Edge IoT Broker y el FogFlow Worker. Si el nodo de borde está basado en ARM, entonces adjunte armar como
    el comando parámetro.

```console
  ./start.sh
```

3.  Detener tanto al corredor Edge IoT como al trabajador de FogFlow:

```console
  ./stop.sh
```

# Conectar los dispositivos de IO a FogFlow

Cuando los datos fluyen desde un dispositivo sensor hacia el corredor, se llama flujo hacia el norte, mientras que es
flujo hacia el sur, cuando los datos fluyen desde el corredor hacia los dispositivos actuadores. FogFlow se basa en este
flujo de datos bidireccional para realizar la la idea real detrás de esto.

Para recibir datos de los dispositivos sensores, consulte
[conectar a un dispositivo sensor](https://fogflow.readthedocs.io/en/latest/example3.html). El tutorial contiene
ejemplos de tanto los dispositivos NGSI como los que no lo son.

FogFlow puede cambiar el estado de los dispositivos actuadores conectados, como por ejemplo, cerrar una puerta, encender
una lámpara, encender un el escudo se enciende o se apaga, etc. a través de sus flujos de procesamiento dinámico. Para
**conectarse a un dispositivo actuador**, refiérase a
[Integrar un dispositivo actuador con FogFlow](https://fogflow.readthedocs.io/en/latest/example5.html). Este tutorial
también contiene ejemplos de dispositivos NGSI y no NGSI (especialmente, los UltraLight y MQTT).

Para tener una idea básica de cómo funciona realmente Southbound en el contexto de FIWARE, véase
[este](https://fiware-tutorials.readthedocs.io/en/latest/iot-agent/index.html#southbound-traffic-commands) tutorial.

# Orquestación dinámica en los bordes usando FogFlow

Antes de seguir adelante, los usuarios deben echar un vistazo a lo siguiente:

-   [Conceptos básicos](https://fogflow.readthedocs.io/en/latest/concept.html) de FogFlow y
-   [Modelo de programación basado en la intención](https://fogflow.readthedocs.io/en/latest/programming.html)

## Define and trigger a Fog Function

FogFlow permite la computación de borde sin servidor, es decir, los desarrolladores pueden definir y enviar una función
de niebla junto con el lógica de procesamiento (u operador) y luego el resto será hecho por FogFlow automáticamente,
incluyendo:

-   la activación de la función de niebla presentada cuando sus datos de entrada estén disponibles
-   decidir cuántas instancias se crearán de acuerdo con la granularidad definida
-   decidir dónde desplegar las instancias creadas o los flujos de procesamiento

### Register the Task Operators

FogFlow permite a los desarrolladores especificar su propio código de función dentro de un operador registrado. Echa un
vistazo a algunos [ejemplos](https://github.com/smartfog/fogflow/tree/master/application/operator) para saber cómo crear
una operador.

Se pueden encontrar plantillas en Python, Java y JavaScript para escribir un operador
[aquí](https://github.com/FIWARE/tutorials.Edge-Computing/tree/master/templates).

Para el tutorial actual, consulte el
[código de operador dummy](https://github.com/FIWARE/tutorials.Edge-Computing/tree/master/dummy). Reemplaza lo siguiente
contenido en el archivo `función.js` y construir la imagen del docker ejecutando el archivo de construcción. Esta imagen
puede ser usada como operador.

```javascript
exports.handler = function(contextEntity, publish, query, subscribe) {
    console.log("enter into the user-defined fog function");

    var entityID = contextEntity.entityId.id;

    if (contextEntity == null) {
        return;
    }
    if (contextEntity.attributes == null) {
        return;
    }

    var updateEntity = {};
    updateEntity.entityId = {
        id: "Stream.result." + entityID,
        type: "result",
        isPattern: false
    };
    updateEntity.attributes = {};
    updateEntity.attributes.city = {
        type: "string",
        value: "Heidelberg"
    };

    updateEntity.metadata = {};
    updateEntity.metadata.location = {
        type: "point",
        value: {
            latitude: 33.0,
            longitude: -1.0
        }
    };

    console.log("publish: ", updateEntity);
    publish(updateEntity);
};
```

Los siguientes pasos son necesarios para registrar un operador en Fogflow.

1.  **Registrar un Operador** para definir cuál sería el nombre del Operador y qué parámetros de entrada necesitaría. El
    En la siguiente imagen se muestra la lista de todos los operadores registrados.

![](https://fiware.github.io/tutorials.Edge-Computing/img/operator-list.png)

Para registrar un nuevo operador, haga clic en el botón "registrar", cree un operador y añádale parámetros. Para definir
el puerto para la aplicación del operador, utilice "service_port" y dé un número de puerto válido como su valor. La
aplicación sería accesible al mundo exterior a través de este puerto.

![](https://fiware.github.io/tutorials.Edge-Computing/img/operator-registry.png)

2.  **Registra una imagen del muelle y elige Operador** para definir la imagen del muelle y asociar una ya registrada
    Operador con él. La siguiente imagen muestra la lista de imágenes de los estibadores registrados y la información
    clave de cada imagen.

![](https://fiware.github.io/tutorials.Edge-Computing/img/dockerimage-registry-list.png)

Haciendo clic en el botón de "registro", rellene la información requerida y haga clic en el botón de "registro" para
terminar el registro.

La forma se explica de la siguiente manera.

-   **Image:** el nombre de su imagen de operador de muelle, debe ser consistente con la que publica para
    [Docker Hub](https://hub.docker.com/)
-   **Tag:** la etiqueta que usaste para publicar la imagen de tu operador en el muelle; por defecto es "última"
-   **Hardware Type:** el tipo de hardware que la imagen de la plataforma soporta, incluyendo x86 o ARM (por ejemplo,
    Raspberry Pi)
-   **OS Type:** el tipo de sistema operativo que la imagen de tu docker soporta; actualmente esto sólo se limita a
    Linux
-   **Operator:** el nombre del operador, que debe ser único y se utilizará al definir una topología de servicio
-   **Prefetched:** si esto se comprueba, significa que todos los nodos del borde comenzarán a buscar esta imagen del
    muelle por adelantado; de lo contrario, la imagen de la rampa del operador se obtiene bajo demanda, sólo cuando los
    nodos de borde necesitan ejecutar una tarea programada. asociado con este operador.

![](https://fiware.github.io/tutorials.Edge-Computing/img/dockerimage-registry.png)

### Definir una función de niebla "dummy"

Haga clic con el botón derecho del ratón dentro del tablero de diseño de tareas, se desplegará un menú que incluye:

-   **Tarea**: se utiliza para definir el nombre de la función de niebla y la lógica de procesamiento (u operador). Una
    tarea tiene entrada y corrientes de salida.
-   **EntityStream**: es el elemento de datos de entrada que se puede vincular con una función de niebla Task como su
    flujo de datos de entrada.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-1.png)

Elija "Tarea", un elemento de la Tarea se colocará en el tablero de diseño, como se muestra a continuación.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-2.png)

Haga clic en el botón de configuración en la esquina superior derecha del elemento de la tarea, como se ilustra en la
siguiente figura. Especifique el nombre de la Tarea y elija un operador de una lista de algunos operadores registrados
previamente.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-3.png)

Añade un "EntityStream" del menú emergente al tablero de diseño.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-4.png)

Contiene los siguientes campos:

-   **Tipo seleccionado:** se utiliza para definir el tipo de entidad del flujo de entrada cuya disponibilidad
    desencadenará la niebla función.
-   **Atributos seleccionados:** para el tipo de entidad seleccionado, qué atributos de la entidad son requeridos por su
    función de niebla; "todos" significa obtener todos los atributos de la entidad.
-   **Group By:** debe ser uno de los atributos de la entidad seleccionada, que define la granularidad de esta función
    de niebla, es decir, el número de instancias para esta función de niebla. En este ejemplo, la granularidad se define
    por "id", que significa que FogFlow creará una nueva instancia de tarea para cada ID de entidad individual.
-   **Scoped:** dice si los datos de la Entidad son específicos de la ubicación o no. True indica que los datos
    específicos de la ubicación son registrado en la Entidad y Falso se utiliza en el caso de los datos emitidos, por
    ejemplo, alguna regla o dato umbral que es válido para todos los lugares, no para un lugar específico.

Configure el EntityStream haciendo clic en su botón de configuración como se muestra a continuación. "Temperatura" se
muestra como ejemplo aquí, al igual que el tipo de entidad de datos de entrada para la función de niebla "dummy".

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-5.png)

Puede haber múltiples EntityStreams para una Tarea y deben estar conectados a la Tarea como se muestra a continuación.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-6.png)

Envíe la función de niebla.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-7.png)

### Desencadenar la función de niebla "dummy"

La función de niebla "Dummy" definida se activa sólo cuando se dispone de los datos de entrada necesarios.

Una forma es registrar un dispositivo sensor de "Temperatura" como se muestra a continuación.

Vaya al menú Dispositivo en la pestaña Estado del sistema. Proporcione la siguiente información.

-   **Device ID**: para especificar una identificación de entidad única
-   **Device Type**: utilizar "Temperature" como tipo de entidad
-   **Location**: para colocar una ubicación en el mapa

![](https://fiware.github.io/tutorials.Edge-Computing/img/device-registration.png)

Una vez registrado el perfil del dispositivo, se creará una nueva entidad de sensor de "Temperatura" y se activará el
"maniquí" función de niebla automáticamente.

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-triggering-device.png)

La otra forma de activar la función de niebla es enviar una actualización de la entidad NGSI en forma de una solicitud
POST al FogFlow para crear la entidad del sensor de "Temperatura".

```console
curl -iX POST \
  'http://localhost:8080/ngsi10/updateContext' \
  -H 'Content-Type: application/json' \
  -d '{
    "contextElements": [
        {
            "entityId": {
                "id": "Device.temp001", "type": "Temperature", "isPattern": false
            },
            "attributes": [
                {
                  "name": "temp", "type": "integer", "value": 10
                }
            ],
            "domainMetadata": [
            {
                "name": "location", "type": "point",
                "value": {
                    "latitude": 49.406393,
                    "longitude": 8.684208
                }
            }
            ]
        }
    ],
    "updateAction": "UPDATE"
}'
```

Verifique si la función de niebla se activa o no de la siguiente manera.

-   compruebe la instancia de tarea de esta función de niebla, como se muestra en la siguiente imagen

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-task-running.png)

-   comprobar el resultado generado por su instancia de tarea en curso, como se muestra en la siguiente imagen

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-streams.png)

## Definir y activar una topología de servicio

La topología del servicio se define como un gráfico de varios operadores. Cada operador de la topología de servicio se
anota con su entradas y salidas, que indican su dependencia de las otras tareas de la misma topología.

**Diferente de las funciones de niebla, una topología de servicio es activada a pedido por un objeto "intencional"
personalizado.**

El estudio de un simple ejemplo de un caso de uso de **Detección de anomalías** puede ayudar a los desarrolladores a
definir y probar una topología de servicio.

Este estudio de caso de uso es para que las tiendas minoristas detecten el consumo anormal de energía en tiempo real.
Como se ilustra en el En la siguiente imagen, una empresa de venta al por menor tiene un gran número de tiendas
distribuidas en diferentes lugares. Para cada tienda, un El dispositivo Raspberry Pi (nodo de borde) se despliega para
monitorear el consumo de energía de todos los paneles de poder en la tienda. En detección de uso anormal de energía en
una tienda (o borde), el mecanismo de alarma de la tienda se activa para informar a la tienda propietario. Además, el
suceso detectado se comunica a la nube para la agregación de información. La información agregada es y luego presentado
al operador del sistema a través de un servicio de tablero de mandos. Además, el operador del sistema puede actualizar
dinámicamente la regla para la detección de anomalías.

![](https://fiware.github.io/tutorials.Edge-Computing/img/retails.png)

### Implementar las funciones del operador

Para este caso de uso específico se utilizan dos operadores, anomalía y contador, que ya están registrados en FogFlow.
Véase a los ejemplos proporcionados en el depósito de códigos.

-   [Anomaly Detector](https://github.com/smartfog/fogflow/tree/master/application/operator/anomaly) operador es
    detectar eventos anómalos basados en los datos recogidos de los paneles de energía en una tienda minorista. Tiene
    dos tipos de entradas:

    -   las reglas de detección son proporcionadas y actualizadas por el operador; El tipo de flujo de entrada de las
        reglas de detección está asociado con "transmisión", lo que significa que las reglas son necesarias para todas
        las instancias de tareas de este operador. La granularidad de este operador se basa en "shopID", lo que
        significa que se creará y configurará una instancia de tarea dedicada para cada tienda.
    -   Los datos de los sensores son proporcionados por el panel de energía.

-   [Counter](https://github.com/smartfog/fogflow/tree/master/application/operator/counter) el operador debe contar el
    el número total de eventos de anomalías para todas las tiendas de cada ciudad. Por lo tanto, la granularidad de su
    tarea es por "ciudad". Su entrada El tipo de corriente es el tipo de corriente de salida del operador anterior
    (Detector de Anomalías).

Hay dos tipos de consumidores de resultados:

1. un servicio de tablero en la nube, que se suscribe a los resultados finales de agregación generados por el contador
   operador para el ámbito global;
2. la alarma en cada tienda, que se suscribe a los eventos de anomalía generados por la tarea del Detector de Anomalías
   en el local nodo de borde en la tienda de venta al público.

![](https://fiware.github.io/tutorials.Edge-Computing/img/retail-flow.png)

### Especifique la topología del servicio

Supongamos que las tareas que se utilizarán en la topología del servicio se han implementado y registrado, sólo hay que
especificar el servicio de la siguiente manera usando el editor de topología de FogFlow.

![](https://fiware.github.io/tutorials.Edge-Computing/img/retail-topology-1.png)

Como se ve en la imagen, se debe proporcionar la siguiente información importante.

1.  definir el perfil de la topología, incluyendo

    -   nombre de la topología: el nombre único de su topología
    -   descripción del servicio: algún texto para describir de qué trata este servicio

2.  dibujar el gráfico de los flujos de procesamiento de datos dentro de la topología de servicio con un clic derecho en
    algún lugar del diseño tablero, elegir o tarea o flujos de entrada o barajar para definir sus flujos de
    procesamiento de datos de acuerdo con el diseño que tienes en mente.

3.  definir el perfil de cada elemento en el flujo de datos, incluyendo los siguientes, utilizando el botón de
    configuración de cada uno.

    -   El perfil de la tarea puede definirse especificando el nombre, el operador y el tipo de entidad.
    -   El perfil **EntityStream** se actualiza con los campos SelectedType, SelectedAttributes, Groupby, Scoped.
    -   **El elemento Shuffle** sirve como conector entre dos tareas de tal manera que la salida de una tarea es la
        entrada para el elemento de barajado y el mismo es reenviado por barajado a otra tarea (o tareas) como entrada.

### Activar la topología de servicio mediante el envío de una intención

La topología de servicio puede ser activada en dos pasos:

-   Envío de un objeto de alto nivel de intención que divide la topología de servicio en tareas separadas
-   Proporcionando flujos de entrada a las tareas de esa topología de servicio.

El objeto de intención se envía usando el tablero de FogFlow con las siguientes propiedades:

-   **Topología:** especifica para qué topología está destinado el objeto de intención.
-   **Prioridad:** define el nivel de prioridad de todas las tareas de su topología, que será utilizado por los nodos de
    borde para decidir cómo se deben asignar los recursos a las tareas.
-   **Uso de recursos:** define cómo una topología puede usar recursos en los nodos del borde. Compartir de forma
    exclusiva significa que el La topología no compartirá los recursos con ninguna tarea de otras topologías. La otra
    forma es inclusiva.
-   **Objetivo:** de máximo rendimiento, mínima latencia y mínimo coste se puede establecer para la asignación de tareas
    en los trabajadores. Sin embargo, esta característica no está totalmente soportada todavía, por lo que puede
    establecerse como "Ninguna" por ahora.
-   **Geoscopio:** es un área geográfica definida donde se deben seleccionar los flujos de entrada. Tanto global como
    personalizado los geóscopos pueden ser configurados.

![](https://fiware.github.io/tutorials.Edge-Computing/img/intent-registry.png)

Tan pronto como se reciben los datos de contexto, que entran en el ámbito del objeto de la intención, se lanzan las
tareas sobre el los trabajadores más cercanos.

Aquí hay ejemplos de rizos para enviar corrientes de entrada para el caso de uso del Detector de Anomalías. Requiere
PowerPanel así como datos de la regla.

> **Nota:** Los usuarios también pueden usar
> [Dispositivos de panel de potencia simulado](https://github.com/smartfog/fogflow/tree/544ebe782467dd81d5565e35e2827589b90e9601/application/device/powerpanel)
> para enviar datos del panel de energía.
>
> El caso Curl asume que el Broker de IO de la nube está funcionando en el host local en el puerto 8070.

```console
curl -iX POST \
  'http://localhost:8070/ngsi10/updateContext' \
-H 'Content-Type: application/json' \
-d '
    {
    "contextElements": [
        {
            "entityId":{
                "id":"Device.PowerPanel.01", "type":"PowerPanel"
            },
           "attributes":[
                {
                    "name":"usage", "type":"integer", "value":4
                },
                {
                    "name":"shop", "type":"string", "value":"01"
                },
                {
                    "name":"iconURL", "type":"string", "value":"/img/shop.png"
                }
           ],
           "domainMetadata":[
                {
                    "name":"location", "type":"point",
                    "value": {
                        "latitude":35.7,
                        "longitude":138
                    }
                },
                {
                    "name":"shop", "type":"string", "value":"01"
                }
           ]
        }
    ],
    "updateAction": "UPDATE"
}'
```

Los resultados de la topología del servicio se publicarán al Corredor, cualquier solicitud que se suscriba a los datos
recibirá la notificación. Un dispositivo actuador también puede recibir estos flujos como entradas del Corredor. Los
flujos resultantes también se puede ver en el menú de Corrientes en el tablero de FogFlow.

# Próximos pasos

¿Quieres aprender a añadir más complejidad a tu aplicación añadiendo funciones avanzadas? Puedes averiguarlo leyendo los
otros [tutoriales de esta serie](https://fiware-tutorials.rtfd.io)

---

## License

[MIT](LICENSE) © 2020 FIWARE Foundation e.V.
