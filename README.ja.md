[![FIWARE Banner](https://fiware.github.io/tutorials.Edge-Computing/img/fiware.png)](https://www.fiware.org/developers)

[![FIWARE Context processing, analysis and visualisation](https://nexus.lab.fiware.org/static/badges/chapters/processing.svg)](https://github.com/FIWARE/catalogue/blob/master/processing/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

これは、[FIWARE FogFlow](https://fogflow.readthedocs.io/en/latest/) の入門チュートリアルであり、ユーザがエッジで処理
フローを動的に調整できるようにします。分散または単一ノード・システムで FogFlow を有効にし、ユーザ定義のワークロード・
パターンを登録し、実行中のタスクの形でエッジでそれらを調整する方法を説明します。理解を深めるために、チュートリアルに
例が含まれています。

## コンテンツ

<details>
<summary><strong>詳細</strong></summary>

-   [アーキテクチャ](#architecture)
    -   [レイヤード・アーキテクチャ](#layered-architecture)
-   [起動](#start-up)
    -   [FogFlow クラウド・ノード](#fogflow-cloud-node)
    -   [FogFlow エッジ・ノード](#fogflow-edge-node)
-   [IoT デバイスを FogFlow に接続](#connect-iot-devices-to-fogflow)
-   [FogFlow を使用したエッジでの動的オーケストレーション](#dynamic-orchestration-at-edges-using-fogflow)
    -   [Fog ファンクションの定義とトリガー](#define-and-trigger-a-fog-function)
        -   [タスク・オペレータの登録](#register-the-task-operators)
        -   ["dummy" Fog ファンクションを定義](#define-a-dummy-fog-function)
        -   ["dummy" Fog ファンクションをトリガー](#trigger-the-dummy-fog-function)
    -   [サービス・トポロジの定義とトリガー](#define-and-trigger-a-service-topology)
        -   [オペレータ・ファンクションの実装](#implement-the-operator-functions)
        -   [サービス・トポロジの指定](#specify-the-service-topology)
        -   [インテントを送信してサービス・トポロジをトリガー](#trigger-the-service-topology-by-sending-an-intent)

</details>

# クラウド-エッジ・コンピューティング (Cloud-Edge Computing)

チュートリアルの目的は、IoT センサ・デバイスがコンテキスト・データを FogFlow に送信する方法、FogFlow がアクチュエータ・
デバイスを介して環境を変更する処理フローをいつ、どこで開始するかをユーザに教えることです。以下の図は、シナリオの概要を
示しています。センサ、アクチュエータ、動的処理フローについては、このチュートリアルの後続のセクションで説明します。
これらのセクションは、以下の図に関連しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fogflow-overall-view.png)

1. ユーザがシナリオを FogFlow に提供します。これには、何をすべきか、いつすべきかが含まれます。FogFlow はどこを行うべき
   かを理解します
2. センサは定期的にコンテキスト・データを FogFlow に送信します。データには、温度、ビデオ・ストリーミング、写真などの
   環境データが含まれる場合があります
3. FogFlow は、エッジでの処理フローをすぐに調整します。これらの処理フローは、アクチュエータの状態を変更したり、一部の
   データを FogFlow にパブリッシュしたりする可能性があります。それはすべて、ユーザが実行したいことに関するものです。

開発者のノウハウを理解するための追加資料として、
[FogFlowチュートリアル](https://fogflow.readthedocs.io/en/latest/introduction.html) を参照してください。FogFlow は他の
FIWARE GEs と統合することもできます。

-   [FogFlow を Scorpio Brokerと統合](https://fogflow.readthedocs.io/en/latest/scorpioIntegration.html)
-   [FogFlow を QuantumLeapと統合](https://fogflow.readthedocs.io/en/latest/QuantumLeapIntegration.html)
-   [FogFlow を WireCloudと統合](https://fogflow.readthedocs.io/en/latest/wirecloudIntegration.html)

<hr class="processing"/>

<a name="architecture"/>

# アーキテクチャ

FogFlow フレームワークは、クラウド・ノード、エッジ・ノード、IoT デバイスを含む、地理的に分散した階層型の異種 ICT
インフラストラクチャで動作します。次の図は、3つの論理層にわたる FogFlow とその主要コンポーネントのシステム・
アーキテクチャを示しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/architecture.png)

<a name="layered-architecture"/>

## レイヤード・アーキテクチャ (Layered Architecture)

論理的には、FogFlow は次の3つのレイヤーで構成されています。

-   **サービス管理:** サービス要件を具体的な実行プランに変換し、生成された実行プランをクラウドとエッジに展開します。
    タスク・デザイナ、トポロジ・マスタ、および Docker レジストリ・サービスは、サービス管理レイヤーを構成します
-   **コンテキスト管理:** すべてのコンテキスト情報を管理し、柔軟なクエリおよびサブスクライブ・インターフェイスを介して
    それらを検出およびアクセス可能にします。このレイヤーは、Context Brokers と IoT Discovery で構成されています
-   **データ処理:** データ処理タスクを起動し、コンテキスト管理レイヤによって提供される pub/sub インターフェースを介して
    タスク間のデータ・フローを確立します。エッジ・ワーカ (そして、もちろんクラウド・ワーカ) はこのレイヤーの下にあります

<a name="start-up"/>

# 起動

起動の前に、必要な Docker イメージをローカルで取得またはビルドしたことを確認する必要があります。以下のコマンドを実行
して、リポジトリのクローンを作成し、必要なイメージを作成してください。

```bash
git clone https://github.com/FIWARE/tutorials.Edge-Computing.git
cd tutorials.Edge-Computing
git checkout NGSI-v2

./services create
```

その後、リポジトリ内で提供されている[サービス](https://github.com/FIWARE/tutorials.Edge-Computing/blob/master/services)
Bash スクリプトを実行することで、コマンドラインからすべてのサービスを初期化できます。

```bash
./services start
```

<a name="fogflow-cloud-node"/>

## FogFlow クラウド・ノード

クラウド・ノードを起動するための**前提条件**は次のとおりです :

-   **Docker:** インストールについては、
    [こちら](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04)
    を参照してください。必要なバージョン > 18.03.1-ce;
-   **Docker-Compose:** インストールについては、
    [こちら](https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04)
    を参照してください。必要なバージョン > 2.4.2;

> **重要:** また、ユーザが sudo なしで Docker コマンドを実行できるようにしてください。

**FogFlow クラウド・サービスのインストールを開始するには、次の操作を行います :**

1. 現在の環境に応じて、config.json の次の IP アドレスを変更します

    - **coreservice_ip**: FogFlow クラウド・ノードのパブリック IP アドレス
    - **external_hostip**: 現在のクラウド/エッジ・ノードのパブリック IP アドレス
    - **internal_hostip**: 現在のノードの "docker0" ネットワーク・インターフェースの IP アドレス
    - **site_id**: FogFlow システムでノードを識別するための一意の文字列ベースの ID
    - **physical_location**: ノードの地理的位置

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

2. FogFlow コンポーネントの Docker イメージをプルして起動します

```console
  docker-compose pull
  docker-compose up -d
```

3. 次の2つの方法のいずれかで FogFlow クラウド・ノードのセットアップを検証します

-   `docker ps -a` を使用して、すべてのコンテナが稼働していることを確認します

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

-   `http://<coreservice_ip>/index.html` にある FogFlow ダッシュボードからシステム・ステータスを確認します。表示される
    Web ページは下図のとおりです

![](https://fiware.github.io/tutorials.Edge-Computing/img/dashboard.png)

<a name="fogflow-edge-node"/>

## FogFlow エッジ・ノード

エッジ・ノードを起動するための**前提条件**は次のとおりです :

-   **Docker:** [Raspberry Piに Docker CE をインストールする方法](https://withblue.ink/2019/07/13/yes-you-can-run-docker-on-raspbian.html)
    を参照してください。

**インストールを開始するには、次のようにします。**

1. 設定ファイルをクラウド・ノードと同様に変更しますが、coreservice_ip はクラウド・ノードの IP アドレスであるため、
   変更されません。

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

2. Edge IoT Broker と FogFlow Worker の両方を起動します。エッジ・ノードが ARM ベースの場合は、コマンド・パラメータとして
   arm を追加します。

```console
  ./start.sh
```

3. Edge IoT Broker と FogFlow Worker の両方を停止します :

```console
  ./stop.sh
```

<a name="connect-iot-devices-to-fogflow"/>

# IoT デバイスを FogFlow に接続

センサ・デバイスからブローカーに向かうデータ・フローはノースバウンド・フローと呼ばれ、ブローカーからアクチュエータ・
デバイスにデータ・フローが流れる場合はサウスバウンド・フローと呼ばれます。FogFlow は、この双方向のデータ・フローに依存
して、その背後にある実際のアイデアを実現します。

センサ・デバイスからデータを受信するには、
[センサ・デバイスに接続する](https://fogflow.readthedocs.io/en/latest/example3.html)を参照してください。チュートリアル
には、NGSI デバイスと非 NGSI デバイスの両方の例が含まれています。

FogFlow は、動的な処理フローを通じて、ドアのロック、ランプのスイッチのオン、シールドのオン/オフなど、接続されている
アクチュエータ・デバイスの状態を変更できます。**アクチュエータ・デバイスに接続する**には、
[アクチュエータ・デバイスと FogFlow の統合](https://fogflow.readthedocs.io/en/latest/example5.html)を参照してください。
このチュートリアルには、NGSI デバイスと非 NGSI デバイス (特に、UltraLight デバイスと MQTT デバイス) の例も含まれて
います。

サウスバウンドが実際に FIWARE のコンテキストでどのように機能するかについての基本的なアイデアを得るには、
[この](https://fiware-tutorials.readthedocs.io/en/latest/iot-agent/index.html#southbound-traffic-commands)
チュートリアルを参照してください。

<a name="dynamic-orchestration-at-edges-using-fogflow"/>

# FogFlow を使用したエッジでの動的オーケストレーション

先に進む前に、ユーザは以下を確認する必要があります :

-   FogFlow の[コア・コンセプト](https://fogflow.readthedocs.io/en/latest/concept.html)
-   [インテント・ベースのプログラミング・モデル](https://fogflow.readthedocs.io/en/latest/programming.html)

<a name="define-and-trigger-a-fog-function"/>

## Fog ファンクションを定義してトリガー

FogFlow はサーバーレス・エッジ・コンピューティングを可能にします。つまり、開発者は処理ロジック (またはオペレータ)
とともに Fog ファンクションを定義および送信でき、残りは FogFlow によって自動的に実行されます :

-   入力データが利用可能になったときに送信された Fog ファンクションをトリガーします
-   定義された粒度 (granularity) に従って作成されるインスタンスの数を決定します
-   作成されたインスタンスまたは処理フローをデプロイする場所を決定します

<a name="register-the-task-operators"/>

### タスク・オペレータを登録

FogFlow を使用すると、開発者は登録済みオペレータ内で独自のファンクション・コードを指定できます。いくつかの
[例](https://github.com/smartfog/fogflow/tree/master/application/operator) をチェックして、カスタマイズされた
オペレータの作成方法を確認してください。

オペレータを作成するための Python, Java, JavaScript テンプレートは
[こちら](https://github.com/FIWARE/tutorials.Edge-Computing/tree/master/templates)にあります。

現在のチュートリアルについては、
[ダミー・オペレータ・コード](https://github.com/FIWARE/tutorials.Edge-Computing/tree/master/dummy)
を参照してください。`function.js` ファイルの次のコンテンツを置き換え、ビルド・ファイルを実行して Docker イメージを
ビルドします。このイメージはオペレータとして使用できます。

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

Fogflow にオペレータを登録するには、次の手順が必要です。

1. **オペレータを登録**して、オペレータの名前と必要な入力パラメータを定義します。次の図は、すべての登録済みオペレータの
   リストを示しています

![](https://fiware.github.io/tutorials.Edge-Computing/img/operator-list.png)

新しいオペレータを登録するには、"register" ボタンをクリックし、オペレータを作成してパラメータを追加します。オペレータ・
アプリケーションのポートを定義するには、"service_port" を使用し、その値として有効なポート番号を指定します。
アプリケーションは、このポートを介して外部からアクセスできます。

![](https://fiware.github.io/tutorials.Edge-Computing/img/operator-registry.png)

2. **Docker イメージを登録し、オペレータを選択して**、Docker イメージを定義し、すでに登録されているオペレータを関連付け
   ます。次の図は、登録済みの Docker イメージのリストと各イメージの重要な情報を示しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/dockerimage-registry-list.png)

"register" ボタンをクリックして必要事項を入力し、"register" ボタンをクリックして登録を完了します。

フォームは次のように説明されます。

-   **Image:** オペレータの Docker イメージの名前。[Docker Hub] に公開するものと一致している必要があります
-   **Tag:** オペレータの Docker イメージの公開に使用したタグ。デフォルトでは "latest" です
-   **Hardware Type:** x86 または ARM (Raspberry Pi など) を含む、Docker イメージがサポートするハードウェア・タイプ
-   **OS Type:** Docker イメージがサポートするオペレーティング・システム・タイプ。現在、これは Linux に限定されています
-   **Operator:** オペレータ名。一意である必要があり、サービス・トポロジを定義するときに使用されます
-   **Prefetched:** これがチェックされている場合、すべてのエッジ・ノードがこの Docker イメージを事前にフェッチし
    始めます。それ以外の場合、エッジ・ノードがこのオペレータに関連付けられたスケジュールされたタスクを実行する必要が
    ある場合にのみ、オペレータの Docker イメージがオンデマンドでフェッチされます

![](https://fiware.github.io/tutorials.Edge-Computing/img/dockerimage-registry.png)

<a name="define-a-dummy-fog-function"/>

### "dummy" Fog ファンクションを定義

タスク・デザイン・ボード内を右クリックすると、次のようなメニューが表示されます :

-   **Task**: Fog ファンクション名と処理ロジック (またはオペレータ) を定義するために使用されます。タスクには入力
    ストリームと出力ストリームがあります
-   **EntityStream**: 入力データストリームとして Fog ファンクション・タスクとリンクできる入力データ要素です

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-1.png)

"Task" を選択すると、以下に示すように、タスク・エレメントがデザイン・ボードに配置されます。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-2.png)

次の図に示すように、タスク要素の右上隅にある設定ボタン (configuration button) をクリックします。タスクの名前を指定し、
いくつかの事前登録されたオペレータのリストからオペレータを選択します。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-3.png)

ポップアップ・メニューからデザイン・ボードに "EntityStream" を追加します。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-4.png)

次のフィールドが含まれます :

-   **Selected Type:** は、その可用性が Fog ファンクションをトリガーする入力ストリームのエンティティ・タイプを定義する
    ために使用されます
-   **Selected Attributes:** は、選択されたエンティティ・タイプに対して、Fog ファンクションに必要なエンティティ属性。
    "all" は、すべてのエンティティ属性を取得することを意味します
-   **Group By:** は、選択されたエンティティ属性の1つである必要があります。これは、この Fog ファンクションの粒度、
    つまり、この Fog ファンクションのインスタンスの数を定義します。この例では、粒度は "id" で定義されています。つまり、
    FogFlow は個々のエンティティ ID ごとに新しいタスク・インスタンスを作成します
-   **Scoped:** は、エンティティ・データが場所固有 (location-specific) かどうかを示します。True は、場所固有のデータが
    エンティティに記録され、ブロードキャスト・データの場合は False が使用されることを示します。たとえば、特定の場所
    ではなく、すべての場所に true を保持するルールまたはしきい値データがあります。

以下に示すように、設定ボタンをクリックして EntityStream を構成します。ここでは例として、"Temperature" を示していますが、
"dummy" Fog ファンクションの入力データのエンティティ・タイプも同様です。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-5.png)

タスクには複数の EntityStream が存在する可能性があり、それらは以下に示すようにタスクに接続されている必要があります。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-6.png)

Fog ファンクションを送信します。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-7.png)

<a name="trigger-the-dummy-fog-function"/>

### "dummy" Fog ファンクションをトリガー

定義された "dummy" フォグ機能は、必要な入力データが利用可能な場合にのみトリガーされます。

1つの方法は、以下に示すように "Temperature" センサ・デバイスを登録することです。

System Status タブの Device メニューに移動します。以下の情報を提供します。

-   **Device ID**: 一意のエンティティ ID を指定します
-   **Device Type**: エンティティ・タイプとして "Temperature" を使用します
-   **Location**: 地図上に場所 (a location) を配置します

![](https://fiware.github.io/tutorials.Edge-Computing/img/device-registration.png)

デバイス・プロファイルが登録されると、新しい "Temperature" センサ・エンティティが作成され、"dummy" Fog ファンクションが
自動的にトリガーされます。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-triggering-device.png)

Fog ファンクションをトリガーするもう1つの方法は、POST リクエストの形式で NGSI エンティティの更新を FogFlow broker に
送信して、"Temperature" センサ・エンティティを作成することです。

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

次の方法で Fog ファンクションがトリガーされているかどうかを確認します。

-   次の図に示すように、この Fog ファンクションのタスク・インスタンスを確認します

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-task-running.png)

-   次の図に示すように、実行中のタスク・インスタンスによって生成された結果を確認します

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog-function-streams.png)

<a name="define-and-trigger-a-service-topology"/>

## サービス・トポロジを定義してトリガー

サービス・トポロジは、いくつかのオペレータのグラフとして定義されます。サービス・トポロジの各オペレータには、
入力と出力の注釈が付けられています。これは、同じトポロジの他のタスクへの依存関係を示しています。

**Fog ファンクションとは異なり、サービス・トポロジはオンデマンドでカスタマイズされた "intent" オブジェクトによって
トリガーされます。**

簡単な**異常検出**の使用事例の調査は、開発者がサービス・トポロジを定義およびテストするのに役立ちます。

この使用事例は、小売店が異常なエネルギー消費をリアルタイムで検出するためのものです。次の図に示すように、小売企業には
さまざまな場所に多数のショップが分散しています。ショップごとに、Raspberry Pi デバイス (エッジ・ノード) が展開され、
ショップ内のすべての電源パネルからの電力消費を監視します。店舗 (またはエッジ) での異常な電力使用を検出すると、
店舗のアラーム・メカニズムがトリガーされ、店舗の所有者に通知します。さらに、検出されたイベントは情報集約のために
クラウドに報告されます。集約された情報は、ダッシュボード・サービスを介してシステム・オペレータに提示されます。
さらに、システム・オペレータは異常検出のルールを動的に更新できます。

![](https://fiware.github.io/tutorials.Edge-Computing/img/retails.png)

<a name="implement-the-operator-functions"/>

### オペレータ・ファンクションを実装

この特定の使用例では、FogFlow にすでに登録されている anomaly と counter の2つのオペレータが使用されています。
コード・リポジトリで提供されている例を参照してください。

-   [Anomaly Detector](https://github.com/smartfog/fogflow/tree/master/application/operator/anomaly) オペレータは、
    小売店の電源パネルから収集されたデータに基づいて異常イベントを検出します。2つのタイプの入力があります

    -   検出ルールは、オペレータによって提供および更新されます。検出ルールの入力ストリーム・タイプは `broadcast`
        に関連付けられています。つまり、このオペレータのすべてのタスク・インスタンスでルールが必要です。このオペレータの
        粒度は `shopID` に基づいています。つまり、専用のタスク・インスタンスが各ショップに対して作成および構成されます
    -   センサ・データは電源パネルから提供されます

-   [Counter](https://github.com/smartfog/fogflow/tree/master/application/operator/counter) オペレータは、各都市のすべて
    の店舗の異常イベントの総数をカウントします。したがって、そのタスクの粒度は "都市" によるものです。その入力ストリーム
    ・タイプは、前のオペレータ (Anomaly Detector) の出力ストリームタイプです

結果コンシューマ (result consumers) には2つのタイプがあります :

1. クラウド内のダッシュボード・サービス。グローバル・スコープの Counter オペレータによって生成された最終的な集計結果に
   サブスクライブします
2. 各店舗のアラーム。小売店のローカル・エッジ・ノードの Anomaly Detector タスクによって生成された異常イベントに
   サブスクライブします

![](https://fiware.github.io/tutorials.Edge-Computing/img/retail-flow.png)

<a name="specify-the-service-topology"/>

### サービス・トポロジを指定

サービス・トポロジで使用されるタスクが実装および登録されていると仮定し、FogFlow トポロジ・エディタを使用して次の方法で
サービス・トポロジを指定します。

![](https://fiware.github.io/tutorials.Edge-Computing/img/retail-topology-1.png)

図のように、次の重要な情報を提供する必要があります。

1. 以下を含むトポロジ・プロファイルを定義します。

    - topology name: トポロジの一意の名前
    - service description: このサービスについて説明するテキスト

2. サービス・トポロジ内のデータ処理フローのグラフをデザイン・ボードのどこかで右クリックして描画し、タスクまたは
   入力ストリームまたはシャッフルを選択して、考えている設計に従ってデータ処理フローを定義します

3. それぞれの設定ボタンを使用して、以下を含むデータ・フローの各要素のプロファイルを定義します

    - **Task** プロファイルは、名前、オペレータ、エンティティ・タイプを指定して定義できます
    - **EntityStream** プロファイルは SelectedType, SelectedAttributes, Groupby, Scoped fields で更新されます
    - **Shuffle** 要素は2つのタスク間のコネクタとして機能し、タスクの出力は Shuffle 要素の入力であり、同じ要素は
      Shuffle によって別のタスク (複数可) に入力として転送されます

<a name="trigger-the-service-topology-by-sending-an-intent"/>

### インテントを送信してサービス・トポロジをトリガー

サービス・トポロジは、次の2つのステップでトリガーできます :

-   サービス・トポロジを個別のタスクに分割する高レベルのインテント・オブジェクトを送信します
-   そのサービス・トポロジのタスクに入力ストリームを提供します

インテント・オブジェクトは、次のプロパティを持つ FogFlowダッシュボードを使用して送信されます。

-   **Topology:** インテント・オブジェクトが対象とするトポロジを指定します
-   **Priority:** トポロジ内のすべてのタスクの優先度レベルを定義します。これは、リソースをタスクに割り当てる方法を
    決定するためにエッジ・ノードによって利用されます
-   **Resource Usage:** トポロジがエッジ・ノードのリソースを使用する方法を定義します。排他的な方法での共有は、
    トポロジが他のトポロジのタスクとリソースを共有しないことを意味します。もう1つは包括的な方法です
-   **Objective:** 最大スループット、最小待ち時間、および最小コストを、ワーカーでのタスク割り当てに設定できます。
    ただし、この機能はまだ完全にはサポートされていないため、現時点では "None" に設定できます
-   **Geoscope:** は、入力ストリームを選択する必要がある定義済みの地理的エリアです。グローバルおよびカスタムの
    ジオスコープを設定できます

![](https://fiware.github.io/tutorials.Edge-Computing/img/intent-registry.png)

インテント・オブジェクトのスコープ内にあるコンテキスト・データを受信するとすぐに、最も近いワーカーでタスクが
起動されます。

Anomaly-Detector の使用例の入力ストリームを送信するための Curl の例を次に示します。PowerPanel とルール・データが
必要です。

> **注:** ユーザは、
> [シミュレートされた PowerPanel デバイス](https://github.com/smartfog/fogflow/tree/544ebe782467dd81d5565e35e2827589b90e9601/application/device/powerpanel)
> を使用して、PowerPanel データを送信することもできます。
>
> Curl のケースでは、クラウド IoT Broker がポート 8070 の localhost で実行されていると想定しています。

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
           "domainMetadata":[                                                                                           {
                    "name":"location", "type":"point",                                                                      "value": {                                                                                                  "latitude":35.7,
                        "longitude":138                                                                                     }
                },                                                                                                      {
                    "name":"shop", "type":"string", "value":"01"
                }
           ]
        }
    ],
    "updateAction": "UPDATE"
}'
```

サービス・トポロジの出力はブローカーに公開され、データをサブスクライブするアプリケーションは通知を受け取ります。
アクチュエータ・デバイスは、ブローカーからの入力としてこれらのストリームを受信することもできます。結果のストリームは、
FogFlow ダッシュボードの Streams メニューにも表示されます。

# 次のステップ

高度な機能を追加することで、アプリケーションに複雑さを加える方法を知りたいですか？このシリーズの
[他のチュートリアル](https://www.letsfiware.jp/fiware-tutorials)を読むことで見つけることができます

---

## License

[MIT](LICENSE) © 2020 FIWARE Foundation e.V.
