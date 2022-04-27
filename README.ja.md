# Cloud-Edge Computing[<img src="https://img.shields.io/badge/NGSI-LD-d6604d.svg" width="90"  align="left" />](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.04.01_60/gs_cim009v010401p.pdf)[<img src="https://fiware.github.io/tutorials.Edge-Computing/img/fiware.png" align="left" width="162">](https://www.fiware.org/)<br/>

[![FIWARE Context processing, analysis and visualisation](https://nexus.lab.fiware.org/static/badges/chapters/processing.svg)](https://github.com/FIWARE/catalogue/blob/master/processing/README.md)
[![License: MIT](https://img.shields.io/github/license/FIWARE/tutorials.Edge-Computing.svg)](https://opensource.org/licenses/MIT)
[![Support badge](https://img.shields.io/badge/tag-fiware-orange.svg?logo=stackoverflow)](https://stackoverflow.com/questions/tagged/fiware)
[![JSON LD](https://img.shields.io/badge/JSON--LD-1.1-f06f38.svg)](https://w3c.github.io/json-ld-syntax/) <br/>
[![Documentation](https://img.shields.io/readthedocs/ngsi-ld-tutorials.svg)](https://ngsi-ld-tutorials.rtfd.io)

これは、ユーザがエッジで処理フローを動的に調整できるようにする [FIWARE FogFlow](https://fogflow.readthedocs.io/en/latest/)
の入門チュートリアルです。分散または単一ノード・システムで FogFlow を有効にし、ユーザ定義のワークロード・パターンを
登録し、実行中のタスクの形でエッジでそれらを調整する方法について説明します。理解を深めるために、チュートリアルには例が
含まれています。

🇯🇵 このチュートリアルは[日本語](README.ja.md)でもご覧いただけます。<br/>

## コンテンツ

<details>
<summary><strong>詳細</strong></summary>

-   [アーキテクチャ](#architecture)
    -   [階層化アーキテクチャ](#layered-architecture)
    -   [FogFlow での NGSI-LD サポート](#ngsi-ld-support-in-fogflow)
-   [起動](#start-up)
    -   [FogFlow クラウド・ノードのセットアップ](#fogflow-cloud-node)
    -   [FogFlow エッジ・ノードのセットアップ](#fogflow-edge-node)
-   [IoT デバイスを FogFlow に接続](#connect-iot-devices-to-fogflow)
-   [FogFlow を使用したエッジでの動的オーケストレーション](#dynamic-orchestration-at-edges-using-fogflow)
    -   [フォグ・ファンクションを定義](#define-and-trigger-a-fog-function)
        -   [タスク・オペレータを登録](#register-the-task-operators)
        -   ["OverSpeed_Vehicle" フォグ・ファンクションを定義](#define-a-overspeed-vehicle-fog-function)
        -   ["OverSpeed_Vehicle" フォグ・ファンクションをトリガー](#trigger-the-overspeed-vehicle-fog-function)
    -   [サービス・トポロジを定義](#define-and-trigger-a-service-topology)
        -   [オペレータ・ファンクションを実装](#implement-the-operator-functions)
        -   [サービス・トポロジを指定](#specify-the-service-topology)
        -   [インテントを送信してサービス・トポロジをトリガー](#trigger-the-service-topology-by-sending-an-intent)

</details>

# クラウド・エッジ・コンピューティング (Cloud-Edge Computing)

チュートリアルの目的は、IoT センサ・デバイスがコンテキスト・データを FogFlow に送信する方法、FogFlow が処理フローを
開始するタイミングと場所をユーザに教えて、アクチュエータ・デバイスを介して環境を変更することです。次の図は、シナリオの
概要を示しています。センサ、アクチュエータ、および動的処理フローは、このチュートリアルの後続のセクションで説明されて
います。これらは、次の図に関連しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fogflow-overall-view.png)

1.  ユーザは自分のシナリオを FogFlow に提供します。これには、何をいつ行うかが含まれます。FogFlow はどこを行うべきかを
    理解します
2.  センサは定期的にコンテキスト・データを FogFlow に送信します。データには、気温、ビデオ・ストリーミング、写真などの
    環境データが含まれる場合があります
3.  FogFlow は、エッジでの処理フローをすぐに調整します。これらの処理フローは、アクチュエータの状態を変更したり、一部の
    データを FogFlow に公開したりする場合があります。これは、ユーザが何をしたいかがすべてです

<hr class="processing"/>

<a name="architecture"></a>

# アーキテクチャ

FogFlow フレームワークは、クラウド・ノード、エッジ・ノード、IoT デバイスを含む、地理的に分散した階層型の異種 ICT
インフラストラクチャで動作します。現在、Fogflow は NGSI-LD 形式をサポートしているため、より動的になっています。つまり、
FogFlow は NGSI-LD に準拠しています。次の図は、FogFlow のシステムアーキテクチャと、3つの論理レイヤーにわたるその主要
コンポーネントを示しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/ngsi-ld-architecture.png)

<a name="layered-architecture"></a>

## 階層化アーキテクチャ

論理的には、FogFlow は次の3つのレイヤーで構成されています:

-   **service management:** サービス管理は、サービス要件を具体的な実行プランに変換し、生成された実行プランをクラウドと
    エッジに展開します。Task Designer, Topology Master および Docker Registry サービスは、一緒になってサービス管理
    レイヤーを構成します
-   **context management:** コンテキスト管理は、すべてのコンテキスト情報を管理し、柔軟なクエリおよびサブスクライブ・
    インターフェイスを介してそれらを検出およびアクセスできるようにします。このレイヤーは、Context Broker と IoT
    Discovery で構成されています
-   **data processing:** データ処理は、データ処理タスクを起動し、コンテキスト管理レイヤーによって提供される pub/sub
    インターフェイスを介してタスク間のデータ・フローを確立します。エッジ・ワーカー (そしてもちろんクラウド・ワーカー)
    はこのレイヤーの下にあります

<a name="ngsi-ld-support-in-fogflow"></a>

# FogFlow での NGSI-LD サポート

FIWARE NGSI v2 情報モデルは、リンクト・データ (エンティティのリレーションシップ)、プロパティ・グラフ、および
セマンティクス (JSON-LD によって提供される機能を活用) をより適切にサポートするように進化しました。データ表現とデータ利用の
新時代は、FogFlow の可能性の新たな地平を切り開きました。NGSI-LD のサポートを組み込むことで、FogFlow は、他の NGSI-LD
準拠のブローカーと対話して、より堅牢なアーキテクチャと潜在的なユースケースを構築する力を獲得しました。

FogFlow がサポートする NGSI-LD API の詳細については、この
[リンク](https://fogflow.readthedocs.io/en/latest/api.html#ngsi-ld-supported-api-s)を参照してください

![](https://fiware.github.io/tutorials.Edge-Computing/img/ngsild_support.png)

<a name="fogflow-cloud-node"></a>

## FogFlow クラウド・ノードのセットアップ

クラウド・ノードを起動するための**前提条件**は次のとおりです:

-   **Docker:** インストールについては、
    [こちら](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04)
    を参照してください。必要なバージョンは 18.03.1-ce 以上です
-   **Docker-Compose:** インストールについては、
    [こちら](https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04)
    を参照してください。必要なバージョンは 2.4.2 以上です

> **重要:** ユーザーが sudo なしで Docker コマンドを実行できるようにしてください

**FogFlow クラウド・サービスのインストールを開始するには、次の手順を実行します:**

1.  現在の環境に応じて、config.json で次の IP アドレスを変更します

    -   **my_hostip**: FogFlow クラウド・ノードのパブリック IP アドレス
    -   **site_id**: FogFlow システムのノードを識別するための一意の文字列ベースの ID
    -   **physical_location**: ノードの地理的位置
    -   **worker.capacity**: FogFlow ノードが呼び出すことができる Docker コンテナの最大数を意味します。
        デフォルトでは、その値は "8" です。

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
> my_hostip の IP アドレスとして "127.0.0.1" を使用しないでください。これは、Docker コンテナ内で実行中のタスクにのみ
> アクセスできるためです。
>
> **Firewall rules**: FogFlow Web ポータルにアクセスできるようにするには、ファイアウォール・ルールで、TCP 経由で次の
> ポート 80 および 5672 を開く必要があります。
>
> **Mac Users**: Macbook で FogFlow をテストする場合は、Docker デスクトップをインストールし、構成ファイルの my_hostip
> として "host.docker.internal" も使用してください。
>
> ポート番号を変更する必要がある場合は、変更がこれら3つの構成ファイルすべてで一貫していることを確認してください。

2.  FogFlow コンポーネントの Docker イメージをプルして起動します

```console
  docker-compose pull
  docker-compose up -d
```

3.  次の2つの方法のいずれかを使用して、FogFlow クラウド・ノードのセットアップを検証します:

-   `docker ps -a` を使用して、すべてのコンテナが稼働しているかどうかを確認します

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

-   FogFlow DashBoard からシステムステータスを `http://<coreservice_ip>/index.html` で確認します。表示される Web
    ページを下図に示します

![](https://fiware.github.io/tutorials.Edge-Computing/img/dashboard.png)

<a name="fogflow-edge-node"></a>

## FogFlow エッジ・ノードのセットアップ

エッジノードを起動するための**前提条件**は次のとおりです:

-   **Docker:**
    [Raspberry Pi Docker CEのインストール](https://withblue.ink/2019/07/13/yes-you-can-run-docker-on-raspbian.html)
    を参照してください

**インストールを開始するには、次の手順を実行します:**

1.  クラウド・ノードと同様に構成ファイルを変更しますが、**coreservice_ip** はクラウド・ノードの IP アドレスであるため、
    統一されたままになります。**my_hostip** は、エッジ・ノードのパブリック IP アドレスに変更されます

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

2.  Edge IoT Broker と FogFlow Worker の両方を起動します。エッジ・ノードが ARM ベースの場合は、コマンド・
    パラメータとして arm を指定します

```console
  ./start.sh
```

3.  Edge IoT Broker と FogFlow Worker の両方を停止します:

```console
  ./stop.sh
```

<a name="connect-iot-devices-to-fogflow"></a>

# IoT デバイスを FogFlow に接続

センサ・デバイスからブローカーに向かうデータ・フローの場合はノースバウンド・フローと呼ばれ、ブローカーから
アクチュエータ・デバイスに向かうデータ・フローの場合はサウスバウンド・フローと呼ばれます。FogFlow は、この双方向の
データ・フローに依存して、その背後にある実際のアイデアを実現します。

センサ・デバイスからデータを受信するには、
[センサ・デバイスへの接続](https://fogflow.readthedocs.io/en/latest/integration.html#northbound-integration)
を参照してください 。チュートリアルには、NGSI デバイスと非 NGSI デバイスの両方の例が含まれています。

FogFlow は、動的な処理フローを通じて、ドアのロック、ランプのオン、シールドのオン/オフなど、接続されているアクチュエータ
・デバイスの状態を変更できます。アクチュエータ・デバイスに接続するには、
[アクチュエータ・デバイスを FogFlow と統合する](https://fogflow.readthedocs.io/en/latest/integration.html#southbound-integration)
を参照してください。このチュートリアルには、NGSI デバイスと非 NGSI デバイス (特に UltraLight デバイスと MQTT デバイス)
の両方の例も含まれています。

サウスバウンドが FIWARE のコンテキストで実際にどのように機能するかについての基本的な考え方を理解するには、
[このチュートリアル](https://fiware-tutorials.readthedocs.io/en/latest/iot-agent/index.html#southbound-traffic-commands)
を参照してください。

<a name="dynamic-orchestration-at-edges-using-fogflow"></a>

# FogFlow を使用したエッジでの動的オーケストレーション

先に進む前に、ユーザは以下を確認する必要があります:

-   FogFlow の[コア・コンセプト](https://fogflow.readthedocs.io/en/latest/core_concept.html)
-   [インテントベースのプログラミング・モデル](https://fogflow.readthedocs.io/en/latest/intent_based_program.html)

<a name="define-and-trigger-a-fog-function"></a>

## フォグ・ファンクションを定義

FogFlow を使用すると、サーバーレス・エッジ・コンピューティングが可能になります。つまり、開発者は処理ロジック (または
オペレータ) とともにフォグ・ファンクションを定義して送信でき、残りは FogFlow によって自動的に実行されます:

-   入力データが利用可能になったときに送信されたフォグ・ファンクションをトリガー
-   定義された粒度に従って、作成するインスタンスの数を決定
-   作成されたインスタンスまたは処理フローをデプロイする場所を決定

<a name="register-the-task-operators"></a>

### タスク・オペレータを登録

FogFlow を使用すると、開発者は登録済みのオペレータ内で独自の機能コードを指定できます。カスタマイズされたオペレータを
作成する方法については、いくつかの
[例](https://github.com/smartfog/fogflow/tree/master/application/operator) と、この
[チュートリアル](https://fogflow.readthedocs.io/en/latest/intent_based_program.html#provide-the-code-of-your-own-function) to
を確認してください。

オペレータを作成するためのPython, Java, JavaScript のテンプレートは、
[ここ](https://github.com/FIWARE/tutorials.Edge-Computing/tree/NGSI-LD/template).
にあります。

現在のチュートリアルについては、以下の手順を参照してください。

FogFlow にオペレータを登録するには、次の手順が必要です。

1.  **オペレータの登録**とは、オペレータの名前と必要な入力パラメータを定義することを意味します

オペレータを登録するには、FogFlow ダッシュボードを開きます。水平バーから [Operator Registry] タブを選択し、左側の
メニューから [Operator Registry] を選択して、[Register] ボタンをクリックします。ワークスペースを右クリックし、
ドロップ・ダウン・リストからオペレータを選択して、次に示されているように詳細を入力し、最後に送信をクリックします。

![](https://fiware.github.io/tutorials.Edge-Computing/img/operator_creation.png)

> **注意:**
>
> ユーザはオペレータにパラメータを追加できます。オペレータ・アプリケーションのポートを定義するには、"service_port"
> を使用し、その値として有効なポート番号を指定します。アプリケーションは、このポートを介して外部からアクセスできます。

2.  **Docker イメージを登録し、[Operator] を選択すると**、Docker イメージを定義し、既に登録されているオペレータを
    それに関連付けることができます。次の図は、登録されている Docker イメージのリストと各イメージの重要な情報を
    示しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/dockerimage-registry-list.png)

"register" ボタンをクリックし、必要な情報を入力し、"register" ボタンをクリックして登録を完了します。

フォームは次のように説明されます。

プリフェッチ：これがチェックされている場合、すべてのエッジノードがこのDockerイメージのフェッチを事前に開始することを意味します。それ以外の場合、オペレータdockerイメージは、エッジノードがこのオペレータに関連付けられたスケジュールされたタスクを実行する必要がある場合にのみ、オンデマンドでフェッチされます。

-   **Image:** イメージは、オペレータの Docker イメージの名前。
    [Docker Hub](https://hub.docker.com/) に公開するイメージと一致している必要があります
-   **Tag:** オペレータの Docker イメージを公開するために使用したタグ。デフォルトでは "latest" です
-   **Hardware Type:** x86 または ARM (Raspberry Pi など) を含む、Docker イメージがサポートするハードウェア・タイプ
-   **OS Type:** Docker イメージがサポートするオペレーティング・システム・タイプ。現在、これは Linux
    のみに限定されています
-   **Operator:** オペレータ名。一意である必要があり、サービス・トポロジを定義するときに使用されます
-   **Prefetched:** これがチェックされている場合、すべてのエッジ・ノードがこの Docker イメージのフェッチを事前に
    開始することを意味します。それ以外の場合、オペレータ の Docker イメージは、エッジ・ノードがこのオペレータに
    関連付けられたスケジュールされたタスクを実行する必要がある場合にのみ、オンデマンドでフェッチされます

> # 注意:
>
> NGSI-LD のチュートリアル用の Docker イメージを登録するときに、"fogflow/overspeedvd" を使用します。
>
> 上記のオペレータは、車両の速度が50を超えると、FogFlow に通知します。
>
> イメージを登録するには、ダッシュボードのオペレータ・レジストリで、左側のメニューから [Docker Image] を選択し、
> [register] ボタンをクリックします。

![](https://fiware.github.io/tutorials.Edge-Computing/img/docker_image_registry.png)

<a name="define-a-overspeed-vehicle-fog-function"></a>

### "OverSpeed_Vehicle" フォグ・ファンクションを定義

タスク・デザイン・ボード内を右クリックすると、次のようなメニューが表示されます:

-   **Task**: タスクはフォグ・ファンクション名と処理ロジック (またはオペレータ) を定義するために使用されます。
    タスクには入力ストリームと出力ストリームがあります
-   **EntityStream**: 入力データ・ストリームとしてフォグ・ファンクションのタスクとリンクできる入力データ要素です

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog_ff_1.png)

"Task" を選択すると、以下に示すように、タスク要素がデザイン・ボードに配置されます。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog_ff_2.png)

次の図に示すように、タスク要素の右上隅にある構成ボタンをクリックします。タスクの名前を指定し、いくつかの事前登録
されたオペレータのリストからオペレータを選択します。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog_ff_3.png)

ポップアップメニューからデザインボードに "EntityStream" を追加します。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog_ff_4.png)

次のフィールドが含まれています:

-   **Selected Type:** 選択されたタイプは、可用性がフォグ・ファンクションをトリガーする入力ストリームのエンティティ・
    タイプを定義するために使用されます
-   **Selected Attributes:** 選択された属性は、選択されたエンティティ・タイプについて、フォグ・ファンクションに必要な
    エンティティ属性。"all" は、すべてのエンティティ属性を取得することを意味します
-   **Group By:** これは、このフォグ・ファンクションの粒度、つまりこのフォグ・ファンクションのインスタンス数を定義する、
    選択されたエンティティ属性の1つである必要があります。この例では、粒度は "id" で定義されています。これは、FogFlow
    が個々のエンティティ ID ごとに新しいタスク・インスタンスを作成することを意味します。
-   **Scoped:** スコープは、エンティティ・データが場所固有であるかどうかを示します。True は、場所固有のデータが
    エンティティに記録されていることを示し、False は、ブロードキャストされたデータの場合に使用されます。たとえば、
    特定の場所ではなく、すべての場所に当てはまるルールまたはしきい値データです。

以下に示すように、"configuration" ボタンをクリックして EntityStream を構成します。"Vehicle" は、"overspeed_vehicle"
フォグ・ファンクションの入力データのエンティティ・タイプであるため、ここでは例として示しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog_ff_5.png)

タスクには複数の EntityStream が存在する可能性があり、以下に示すように、それらをタスクに接続する必要があります。この後、
[submit]ボタンをクリックします。

![](https://fiware.github.io/tutorials.Edge-Computing/img/fog_ff_6.png)

<a name="trigger-the-overspeed-vehicle-fog-function"></a>

### "OverSpeed_Vehicle" フォグ・ファンクションをトリガー

定義された "OverSpeed_Vehicle" フォグ・ファンクションは、必要な入力データが利用可能な場合にのみトリガーされます。

フォグ・ファンクションをトリガーする方法は、POST リクエストの形式で NGSI-LD エンティティの更新を FogFlow Broker
に送信して、"Vehicle" センサ・エンティティを作成することです。このエンティティを作成すると、FogFlow は自動的に
フォグ・ファンクションを起動します。

#### :one: リクエスト

```console
curl --location --request POST '<Fogflow_Broker_IP>:8070/ngsi-ld/v1/entities/' \
--header 'Content-Type: application/json' \
--header 'Accept: application/ld+json' \
--header 'Link: <{{link}}>; rel="https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"; type="application/ld+json"' \
--data-raw '{
    "id": "urn:ngsi-ld:Vehicle:A100",
    "type": "Vehicle",
    "brandName": {
        "type": "Property",
        "value": "Mercedes"
    },
    "isParked": {
        "type": "Relationship",
        "object": "urn:ngsi-ld:OffStreetParking:Downtown1",
        "observedAt": "2017-07-29T12:00:04",
        "providedBy": {
            "type": "Relationship",
            "object": "urn:ngsi-ld:Person:Bob"
        }
    },
    "speed": {
        "type": "Property",
        "value": 80
    },
    "createdAt": "2017-07-29T12:00:04",
    "location": {
        "type": "GeoProperty",
        "value": {
            "type": "Point",
            "coordinates": [
                -8.5,
                41.2
            ]
        }
    }
}'
```

次の方法で、フォグ・ファンクションがトリガーされているかどうかを確認します。

-   次の図に示すように、このフォグ・ファンクションのタスク・インスタンスを確認してください

![](https://fiware.github.io/tutorials.Edge-Computing/img/task_instance.png)

-   次の図に示すように、実行中のタスク・インスタンスによって生成された結果を確認します

![](https://fiware.github.io/tutorials.Edge-Computing/img/task_stream.png)

<a name="define-and-trigger-a-service-topology"></a>

## サービス・トポロジを定義

サービス・トポロジは、複数のオペレータのグラフとして定義されます。サービス・トポロジ内の各オペレータには、同じトポロジ
内の他のタスクへの依存関係を示す入力と出力の注釈が付けられます。

フォグ・ファンクションとは異なり、サービス・トポロジは、カスタマイズされた "インテント" オブジェクトによって
オンデマンドでトリガーされます。

単純な異常検出のユースケース例の研究は、開発者がサービス・トポロジを定義およびテストするのに役立ちます。

このユースケース・スタディは、小売店が異常なエネルギー消費をリアルタイムで検出するためのものです。次の図に示すように、
小売会社にはさまざまな場所に多数のショップが分散しています。ショップごとに、ショップ内のすべての電源パネルからの
電力消費を監視するために、Raspberry Pi デバイス (エッジ・ノード) が展開されます。ショップ (またはエッジ) での異常な
電力使用が検出されると、ショップのアラームメカニズムがトリガーされ、ショップの所有者に通知されます。さらに、検出された
イベントは、情報集約のためにクラウドに報告されます。集約された情報は、ダッシュボード・サービスを介してシステム・
オペレータに提示されます。さらに、システム・オペレータは、異常検出のルールを動的に更新できます。

![](https://fiware.github.io/tutorials.Edge-Computing/img/retails.png)

<a name="implement-the-operator-functions"></a>

### オペレータ・ファンクションを実装

ユーザーは、オペレータの形式で独自の計算セットを実装できます。サービス・トポロジを設計および実装するには、対応する
データ形式 (NGSI-v2, NGSI-LD など) で運用処理ロジックを実装する必要があります。たとえば、サービス・トポロジが NGSI-LD
データ形式で構成されている場合、オペレーターは NGSI-LD 形式を念頭に置いて設計することが重要です。

NGSI-LD オペレータ作成用のテンプレートを参照するには、これらの
[テンプレート](https://github.com/FIWARE/tutorials.Edge-Computing/tree/NGSI-LD/template/NGSILD) を使用します 。

<a name="specify-the-service-topology"></a>

### サービス・トポロジを指定

サービス・トポロジで使用されるタスクが実装および登録されていると想定し、FogFlow トポロジ・エディタを使用して次の方法で
サービス・トポロジを指定するだけです。たとえば、次の図は、サービス・トポロジを実装するためのフローを示しています。

![](https://fiware.github.io/tutorials.Edge-Computing/img/retail-topology-1.png)

図のように、以下の重要な情報を提供する必要があります:

1.  トポロジ・プロファイルを定義します

    -   トポロジ名: トポロジの一意の名前
    -   サービスの説明: このサービスの内容を説明するテキスト

2.  デザイン・ボードのどこかを右クリックして、サービス・トポロジ内のデータ処理フローのグラフを描画し、タスクまたは
    入力ストリームを選択するか、シャッフルして、考えているデザインに従ってデータ処理フローを定義します

3.  それぞれの構成ボタンを使用して、以下を含むデータ・フローの各要素のプロファイルを定義します

    -   **Task** プロファイルは、名前、オペレータ、およびエンティティ・タイプを指定することで定義できます
    -   **EntityStream** プロファイルは、SelectedType, SelectedAttributes, Groupby, Scoped フィールドで更新されます
    -   **Shuffle** 要素は、タスクの出力がシャッフル要素の入力であり、同じものがシャッフルによって入力として別のタスクに
        転送されるように、2つのタスク間のコネクタとして機能します

<a name="trigger-the-service-topology-by-sending-an-intent"></a>

### インテントを送信してサービス・トポロジをトリガー

サービス・トポロジは、次の2つのステップでトリガーできます:

-   サービス・トポロジを個別のタスクに分割する高レベルのインテント・オブジェクトを送信
-   そのサービス・トポロジのタスクに入力ストリームを提供

インテント・オブジェクトは、次のプロパティを持つ FogFlow ダッシュボードを使用して送信されます:

-   **Topology:** インテント・オブジェクトの対象となるトポロジを指定します
-   **Priority:** トポロジ内のすべてのタスクの優先度レベルを定義します。これは、リソースをタスクに割り当てる方法を
    決定するためにエッジ・ノードによって使用されます
-   **Resource Usage:** トポロジがエッジ・ノードのリソースをどのように使用できるかを定義します。排他的な方法で共有する
    ということは、トポロジが他のトポロジのタスクとリソースを共有しないことを意味します。もう1つの方法は包括的です。
-   **Objective:** 最大スループット、最小遅延、最小コストをワーカーでのタスク割り当てに設定できます。ただし、この機能は
    まだ完全にはサポートされていないため、現時点では "None" に設定できます
-   **Geoscope:** 入力ストリームを選択する必要がある定義済みの地理的領域です。グローバル・ジオスコープと
    カスタム・ジオスコープを設定できます

サービス・トポロジの出力はブローカーに公開され、データをサブスクライブしているすべてのアプリケーションが通知を受け取ります。
アクチュエータ・デバイスは、ブローカーからの入力としてこれらのストリームを受信することもできます。結果のストリームは、
FogFlow ダッシュボードの [Streams] メニューにも表示されます。

# 次のステップ

FogFlow がどのように機能するかを理解するための追加資料については、
[FogFlow チュートリアル](https://fogflow.readthedocs.io/en/latest/introduction.html)
にアクセスして ください。FogFlow は、他の FIWARE GEs と統合することもできます。

-   FogFlow を NGSI-LD Broker と統合: FogFlow は、クラウド・ノードとエッジ・ノードをサポートする堅牢なプラットフォームに
    進化しました。エッジ計算のためにエッジを分散させるという主な概念は、FogFlow と他の NGSI-LD Broker の相互作用によって
    進化しました。NGSI-LD テクノロジは、データ通信とデータ表現の新しい地平です。FogFlow は NGSI_LD 準拠の Broker
    になりました。詳細については、[このチュートリアル](https://fogflow.readthedocs.io/en/latest/scorpioIntegration.html)
    を参照してください

-   FogFlow と監視ツールの統合: FogFlow は分散アーキテクチャを備えているため、プラットフォームから FogFlow の
    分散コンポーネントを監視する必要があります。このため、FogFlow は Grafana と Elastisearch を統合して、メモリ使用率、
    CPU 使用率、サービスの現在の状態などのさまざまなコンポーネントを監視しています。このトピックの詳細については、
    [このチュートリアル](https://fogflow.readthedocs.io/en/latest/system_monitoring.html)を参照してください

-   FogFlow をセキュリティ・コンポーネントと統合: FogFlow は、セキュリティ機能をサポートすることにより、それ自体を強化
    しました。IoT デバイスとエッジ間の通信、およびクラウドとエッジ間の通信は、Keyrock (Identity Manager) と Wilma
    (PEP Proxy) を使用して保護されています。FogFlow のセキュリティ設定の詳細については、
    [このチュートリアル](https://fogflow.readthedocs.io/en/latest/https.html#secure-fogflow-using-identity-management)
    を参照してください

-   FogFlow とQuantumLeap の統合: FogFlow は、NGSI-v2 時空間データを保存、クエリ、取得するための REST サービスである
    QuantumLeap と統合できます。QuantumLeap は、NGSI の半構造化データを表形式に変換し、時系列データベースに保存します。
    これにより、さまざまなシナリオで FogFlow を利用するための新しい可能性が開かれました。詳細については、
    [このチュートリアル](https://fogflow.readthedocs.io/en/latest/quantumleapIntegration.html)を参照してください

-   FogFlow を WireCloud と統合する: FogFlow は、さまざまで用途の広いエッジ・プラットフォーム・テクノロジを採用しています。
    WireCloud は、最先端のエンドユーザ開発、RIA、およびセマンティック・テクノロジに基づいて構築されており、サービスの
    インターネットのロングテールを活用することを目的とした次世代のエンドユーザ中心の Web アプリケーション・マッシュアップ
    ・プラットフォームを提供します。FogFlow と WireCloud の詳細については、
    [このチュートリアル](https://fogflow.readthedocs.io/en/latest/wirecloudIntegration.html)を参照してください

---

## License

[MIT](LICENSE) © 2020-2021 FIWARE Foundation e.V.
