[![FIWARE Banner](https://fiware.github.io/tutorials.Edge-Computing/img/fiware.png)](https://www.fiware.org/developers)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

[![FIWARE Context processing, analysis and visualisation](https://nexus.lab.fiware.org/static/badges/chapters/processing.svg)](https://github.com/FIWARE/catalogue/blob/master/processing/README.md)


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

<a name="fogflow-cloud-node"/>

## FogFlow クラウド・ノード の起動

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

    -   **my_hostip**: FogFlow クラウド・ノードのパブリック IP アドレス
    -   **site_id**: FogFlow システムのノードを識別するための一意の文字列ベースの ID
    -   **physical_location**: ノードの地理的位置
    -   **worker.capacity**: これは、FogFlow ノードが呼び出すことができる Docker コンテナの最大数を意味します。
        デフォルトでは、その値は "8" です

```json
{
    "my_hostip": "10.156.0.9",
    "physical_location": {
        "longitude": 139.709059,
        "latitude": 35.692221
    },
    "site_id": "001",
    "worker": {
        "container_autoremove": false,
        "start_actual_task": true,
        "capacity": 8
    }
}
```
> ## 重要 !
>
> my_hostip の IP アドレスとして "127.0.0.1" を使用しないでください。これは、 Docker コンテナ内で実行中のタスクに
> のみアクセスできるためです。 
>
> **ファイアウォール・ルール**: FogFlow Web ポータルにアクセスできるようにするには、TCP 経由でポート 80 および 5672
> を開く必要があります。
>
> **Mac ユーザ**: Macbook で FogFlow をテストする場合は、Docker デスクトップをインストールし、構成ファイルの my_hostip
  として "host.docker.internal" も使用してください。
>
> ポート番号を変更する必要がある場合は、変更がこれら3つの構成ファイルすべてで一貫していることを確認してください。

2. FogFlow コンポーネントの Docker イメージをプルして起動します

```console
git clone https://github.com/FIWARE/tutorials.Edge-Computing.git
cd tutorials.Edge-Computing
git checkout NGSI-v2

docker-compose pull
docker-compose up -d
```

3. 次の2つの方法のいずれかで FogFlow クラウド・ノードのセットアップを検証します

-   `docker ps -a` を使用して、すべてのコンテナが稼働していることを確認します

```console
docker ps -a
```

```text
CONTAINER ID   IMAGE                   COMMAND                  CREATED         STATUS         PORTS                                                                                            NAMES
e412877b4862   nginx:latest            "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes   0.0.0.0:80->80/tcp                                                                               tutorialsedgecomputing_nginx_1
29ea8555685d   fogflow/master:3.2      "/master"                2 minutes ago   Up 2 minutes   0.0.0.0:1060->1060/tcp                                                                           tutorialsedgecomputing_master_1
aaa2f29959e7   fogflow/worker:3.2      "/worker"                2 minutes ago   Up 2 minutes                                                                                                    tutorialsedgecomputing_cloud_worker_1
1298fe46bf1e   fogflow/designer:3.2    "node main.js"           2 minutes ago   Up 2 minutes   0.0.0.0:1030->1030/tcp, 0.0.0.0:8080->8080/tcp                                                   tutorialsedgecomputing_designer_1
644333fa6215   fogflow/broker:3.2      "/broker"                2 minutes ago   Up 2 minutes   0.0.0.0:8070->8070/tcp                                                                           tutorialsedgecomputing_cloud_broker_1
acd974d6c040   fogflow/discovery:3.2   "/discovery"             2 minutes ago   Up 2 minutes   0.0.0.0:8090->8090/tcp                                                                           tutorialsedgecomputing_discovery_1
cce2c64503d9   dgraph/standalone       "/run.sh"                2 minutes ago   Up 2 minutes   0.0.0.0:6080->6080/tcp, 0.0.0.0:8000->8000/tcp, 0.0.0.0:8082->8080/tcp, 0.0.0.0:9082->9080/tcp   tutorialsedgecomputing_dgraph_1
925d1deb343f   rabbitmq:3              "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   4369/tcp, 5671/tcp, 15691-15692/tcp, 25672/tcp, 0.0.0.0:5672->5672/tcp                           tutorialsedgecomputing_rabbitmq_1
```

-   `http://<coreservice_ip>/index.html` にある FogFlow ダッシュボードからシステム・ステータスを確認します。表示される
    Web ページは下図のとおりです

![](https://fiware.github.io/tutorials.Edge-Computing/img/dashboard.png)

<a name="fogflow-edge-node"/>

## FogFlow エッジ・ノード の起動

エッジ・ノードを起動するための**前提条件**は次のとおりです :

-   **Docker:** [Raspberry Piに Docker CE をインストールする方法](https://withblue.ink/2019/07/13/yes-you-can-run-docker-on-raspbian.html)
    を参照してください。

**インストールを開始するには、次のようにします。**

1.  クラウド・ノードと同様に構成ファイルを変更しますが、**coreservice_ip** はクラウド・ノードの IP アドレスであるため、
    統一されたままになります。**my_hostip** はエッジ・ノードのパブリック IP アドレスに変更されます。

```json
{
    "coreservice_ip": "10.156.0.9",
    "my_hostip": "172.17.0.1",
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
[センサ・デバイスに接続する]((https://fogflow.readthedocs.io/en/latest/integration.html#northbound-integration)
を参照してください。チュートリアルには、NGSI デバイスと非 NGSI デバイスの両方の例が含まれています。

FogFlow は、動的な処理フローを通じて、ドアのロック、ランプのスイッチのオン、シールドのオン/オフなど、接続されている
アクチュエータ・デバイスの状態を変更できます。**アクチュエータ・デバイスに接続する**には、
[アクチュエータ・デバイスと FogFlow の統合](https://fogflow.readthedocs.io/en/latest/integration.html#southbound-integration)
を参照してください。このチュートリアルには、NGSI デバイスと非 NGSI デバイス (特に、UltraLight デバイスと MQTT デバイス)
の例も含まれています。

サウスバウンドが実際に FIWARE のコンテキストでどのように機能するかについての基本的なアイデアを得るには、
[この](https://fiware-tutorials.readthedocs.io/en/latest/iot-agent/index.html#southbound-traffic-commands)
チュートリアルを参照してください。

<a name="dynamic-orchestration-at-edges-using-fogflow"/>

# FogFlow を使用したエッジでの動的オーケストレーション

先に進む前に、ユーザは以下を確認する必要があります :

-   FogFlow の[コア・コンセプト](https://fogflow.readthedocs.io/en/latest/core_concept.html)
-   [インテント・ベースのプログラミング・モデル](https://fogflow.readthedocs.io/en/latest/intent_based_program.html)

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
[例](https://github.com/smartfog/fogflow/tree/master/application/operator) と
[チュートリアル](https://fogflow.readthedocs.io/en/latest/intent_based_program.html#provide-the-code-of-your-own-function)
をチェックして、カスタマイズされたオペレータの作成方法を確認してください。

オペレータを作成するための Python, Java, JavaScript テンプレートは
[こちら](https://github.com/FIWARE/tutorials.Edge-Computing/tree/master/templates)にあります。

現在のチュートリアルについては、以下の手順を参照してください:

FogFlow にオペレータを登録するには、次の手順が必要です。

1.  **オペレータの登録**とは、オペレータの名前と必要な入力パラメータを定義することを意味します。

オペレータを登録するには、FogFlow ダッシュボードを開きます。水平バーから "Operator Registry" タブを選択し、左側の
メニューから "Operator Registry" を選択して、"Register" ボタンをクリックします。ワークスペースを右クリックし、
ドロップ・ダウン・リストからオペレータを選択して、詳細を入力し、最後に送信をクリックします。

![](https://fiware.github.io/tutorials.Edge-Computing/img/operator-registry.png)

> **注:**
>
> ユーザはオペレータにパラメータを追加できます。オペレータ・アプリケーションのポートを定義するには、"service_port"
> を使用し、その値として有効なポート番号を指定します。アプリケーションは、このポートを介して外部からアクセスできます。

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

#### 1️⃣ リクエスト:

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

#### 2️⃣ リクエスト:

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

FogFlow がどのように機能するかを理解するための追加資料については、
[FogFlow チュートリアル](https://fogflow.readthedocs.io/en/latest/introduction.html)
にアクセスしてください。 FogFlow は、他の FIWARE GEs と統合することもできます。

-   **FogFlow を NGSI-LD Broker と統合**: FogFlow は、クラウド・ノードとエッジ・ノードをサポートする堅牢なプラット
    フォームに進化しました。 エッジ・コンピューティングのためにエッジを分散させるという主な概念は、FogFlow と他の
    NGSI-LD Broker の相互作用によって進化しました。NGSI-LD テクノロジは、データ通信とデータ表現の新しい地平です。
    FogFlow は NGSI_LD 準拠のブローカーになりました。詳細については、
    この[チュートリアル](https://fogflow.readthedocs.io/en/latest/scorpioIntegration.html)を参照してください

-   **FogFlow を監視ツールと統合**: FogFlow は分散アーキテクチャを備えているため、プラットフォームから FogFlow
    の分散コンポーネントを監視する必要があります。このため、FogFlow は Grafana と Elastisearch を統合して、
    メモリ使用率、CPU 使用率、サービスの現在の状態などのさまざまなコンポーネントを監視しています。このトピックの
    詳細については、この[チュートリアル](https://fogflow.readthedocs.io/en/latest/system_monitoring.html)
    を参照してください

-   **FogFlow をセキュリティコンポーネントと統合**: FogFlow は、セキュリティ機能をサポートすることにより、
    それ自体を強化しました。IoT デバイスとエッジ間の通信、およびクラウドとエッジ間の通信は、IDM (Identity Manager
    Keyrock) と Wilma (PEP Proxy) を使用して保護されています。FogFlow のセキュリティ設定の詳細については、この
    [チュートリアル](https://fogflow.readthedocs.io/en/latest/https.html#secure-fogflow-using-identity-management)
    を参照してください

-   **FogFlow を QuantumLeap と統合**: FogFlow は、NGSI v2 の時空間データを保存、クエリ、取得するための REST
    サービスである QuantumLeap と統合できます。QuantumLeap は、NGSI の半構造化データを表形式に変換し、
    時系列データベースに保存します。これにより、さまざまなシナリオで FogFlow を利用するための新しい可能性が
    開かれました。 詳細については、
    [チュートリアル](https://fogflow.readthedocs.io/en/latest/quantumleapIntegration.html)
    を参照してください

-   **FogFlow を WireCloud と統合**: FogFlow は、さまざまな用途の広いエッジ・プラットフォーム・テクノロジを
    採用しています。WireCloud は、最先端のエンドユーザ開発、RIA、およびセマンティック・テクノロジに基づいて
    構築されており、サービスのインターネットのロングテールを活用することを目的とした次世代のエンドユーザ中心の
    Web アプリケーション・マッシュアップ・プラットフォームを提供します。Fogflow と WireCloud の詳細については、
    [チュートリアル](https://fogflow.readthedocs.io/en/latest/wirecloudIntegration.html)
    を参照してください

高度な機能を追加することで、アプリケーションに複雑さを加える方法を知りたいですか？このシリーズの
[他のチュートリアル](https://www.letsfiware.jp/fiware-tutorials)を読むことで見つけることができます

---

## License

[MIT](LICENSE) © 2020-2023 FIWARE Foundation e.V.
