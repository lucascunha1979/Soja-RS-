
"use strict";


/* ==========================================================
   ESTADO
========================================================== */

const state = {

    config: null,
    jenks: null,
    geojson: null,
    serieRS: null,
    municipiosIndex: null,

    anoData: null,

    indicator:
        "area_plantada",

    grandeza:
        "ha",

    ano:
        2024,

    municipioSelecionado:
        null,

    map:
        null,

    geoLayer:
        null,

    layerByCode:
        new Map(),

    currentRows:
        [],

    animationRunning:
        false,

    animationToken:
        0,

    animationDelay:
        900
};



/* ==========================================================
   ELEMENTOS
========================================================== */

const el = {

    indicador:
        document.getElementById("indicador"),

    grandeza:
        document.getElementById("grandeza"),

    grupoGrandeza:
        document.getElementById("grupo-grandeza"),

    ano:
        document.getElementById("ano"),

    anoLabel:
        document.getElementById("ano-label"),

    municipio:
        document.getElementById("municipio-select"),

    aviso:
        document.getElementById("aviso"),

    legend:
        document.getElementById("legend"),

    ranking:
        document.getElementById("ranking"),

    tableBody:
        document.getElementById("table-body"),

    tableSearch:
        document.getElementById("table-search"),

    downloadCsv:
        document.getElementById("download-csv"),

    cardTotal:
        document.getElementById("card-total"),

    cardTotalLabel:
        document.getElementById("card-total-label"),

    cardTotalNote:
        document.getElementById("card-total-note"),

    cardMedia:
        document.getElementById("card-media"),

    cardMediana:
        document.getElementById("card-mediana"),

    cardValidos:
        document.getElementById("card-validos"),

    cardPctRS:
        document.getElementById("card-pct-rs"),

    mapTitle:
        document.getElementById("map-title"),

    mapSubtitle:
        document.getElementById("map-subtitle"),

    rankingSubtitle:
        document.getElementById("ranking-subtitle"),

    stateChartSubtitle:
        document.getElementById("state-chart-subtitle"),

    municipalChartTitle:
        document.getElementById("municipal-chart-title"),

    municipalChartSubtitle:
        document.getElementById("municipal-chart-subtitle"),

    governmentChartSubtitle:
        document.getElementById("government-chart-subtitle"),

    tableSubtitle:
        document.getElementById("table-subtitle"),

    tableValueHeader:
        document.getElementById("table-value-header"),

    mapPlay:
        document.getElementById("map-play"),

    animationSpeed:
        document.getElementById("animation-speed")
};



/* ==========================================================
   UTILIDADES
========================================================== */

async function loadJSON(url) {

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            `Erro ${response.status}: ${url}`
        );
    }

    return await response.json();
}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );
}



/* ==========================================================
   INDICADOR
========================================================== */

function getIndicatorKey() {

    if (
        state.indicator
        === "area_plantada"
    ) {

        return (
            state.grandeza
            === "pct_municipio"

            ? "pct_area_municipal_plantada"

            : "area_plantada_ha"
        );
    }


    if (
        state.indicator
        === "area_colhida"
    ) {

        return (
            state.grandeza
            === "pct_municipio"

            ? "pct_area_municipal_colhida"

            : "area_colhida_ha"
        );
    }


    return state.indicator;
}


function getIndicatorConfig() {

    return (
        state.config
            .indicadores[
                getIndicatorKey()
            ]
    );
}


function isAreaIndicator() {

    return (
        state.indicator
        === "area_plantada"

        ||

        state.indicator
        === "area_colhida"
    );
}



/* ==========================================================
   FORMATAÇÃO
========================================================== */

function formatNumber(
    value,
    decimals=0
) {

    if (
        value === null
        ||
        value === undefined
        ||
        Number.isNaN(
            Number(value)
        )
    ) {

        return "Sem dado";
    }


    return Number(value)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits:
                    decimals,

                maximumFractionDigits:
                    decimals
            }
        );
}


function formatMoneyFromThousands(
    value
) {

    if (
        value === null
        ||
        value === undefined
        ||
        Number.isNaN(
            Number(value)
        )
    ) {

        return "Sem dado";
    }


    const reais =
        Number(value) * 1000;


    if (
        Math.abs(reais)
        >= 1_000_000_000
    ) {

        return (
            "R$ "
            +
            formatNumber(
                reais / 1_000_000_000,
                2
            )
            +
            " bilhões"
        );
    }


    if (
        Math.abs(reais)
        >= 1_000_000
    ) {

        return (
            "R$ "
            +
            formatNumber(
                reais / 1_000_000,
                2
            )
            +
            " milhões"
        );
    }


    if (
        Math.abs(reais)
        >= 1000
    ) {

        return (
            "R$ "
            +
            formatNumber(
                reais / 1000,
                2
            )
            +
            " mil"
        );
    }


    return (
        "R$ "
        +
        formatNumber(
            reais,
            2
        )
    );
}


function formatValue(
    value,
    key=getIndicatorKey()
) {

    if (
        value === null
        ||
        value === undefined
        ||
        Number.isNaN(
            Number(value)
        )
    ) {

        return "Sem dado";
    }


    const cfg =
        state.config
            .indicadores[key];


    if (
        cfg.unidade
            .includes("R$ mil")
    ) {

        return (
            formatMoneyFromThousands(
                value
            )
        );
    }


    if (
        cfg.unidade
        === "%"
    ) {

        return (
            formatNumber(
                value,
                2
            )
            +
            "%"
        );
    }


    if (
        cfg.unidade
        === "ha"
    ) {

        return (
            formatNumber(
                value,
                0
            )
            +
            " ha"
        );
    }


    if (
        cfg.unidade
        === "t"
    ) {

        return (
            formatNumber(
                value,
                0
            )
            +
            " t"
        );
    }


    if (
        cfg.unidade
        === "kg/ha"
    ) {

        return (
            formatNumber(
                value,
                0
            )
            +
            " kg/ha"
        );
    }


    return (
        formatNumber(
            value,
            2
        )
    );
}


function unitExplanation(
    key=getIndicatorKey()
) {

    const cfg =
        state.config
            .indicadores[key];


    if (
        cfg.unidade
        === "ha"
    ) {

        return (
            "Unidade: hectares "
            +
            "(k = mil; M = milhões)"
        );
    }


    if (
        cfg.unidade
        === "t"
    ) {

        return (
            "Unidade: toneladas "
            +
            "(k = mil; M = milhões)"
        );
    }


    if (
        cfg.unidade
        === "kg/ha"
    ) {

        return (
            "Unidade: quilogramas por hectare"
        );
    }


    if (
        cfg.unidade
        === "%"
    ) {

        return (
            "Unidade: percentual (%)"
        );
    }


    if (
        cfg.unidade
            .includes("R$ mil")
    ) {

        return (
            "Valores exibidos em R$ milhões "
            +
            "ou bilhões quando necessário"
        );
    }


    return cfg.unidade;
}



/* ==========================================================
   JENKS
========================================================== */

function getClassIndex(
    value,
    key=getIndicatorKey()
) {

    if (
        value === null
        ||
        value === undefined
        ||
        Number.isNaN(
            Number(value)
        )
    ) {

        return null;
    }


    const n =
        Number(value);


    if (
        n === 0
    ) {

        return -1;
    }


    const info =
        state.jenks[key];


    if (!info) {

        return null;
    }


    for (
        let i = 0;
        i < info.bins.length;
        i++
    ) {

        if (
            n <= info.bins[i]
        ) {

            return i;
        }
    }


    return (
        info.bins.length - 1
    );
}


function getColor(
    value
) {

    const idx =
        getClassIndex(
            value
        );


    if (
        idx === null
    ) {

        return (
            state.config
                .paleta
                .sem_dado
        );
    }


    if (
        idx === -1
    ) {

        return (
            state.config
                .paleta
                .zero
        );
    }


    return (
        state.config
            .paleta
            .classes[idx]
    );
}



/* ==========================================================
   MAPA
========================================================== */

function initializeMap() {

    state.map =
        L.map(
            "map",
            {
                zoomControl:
                    true,

                preferCanvas:
                    true
            }
        )
        .setView(
            [-30.2,-53.2],
            6
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom:
                18,

            attribution:
                "&copy; OpenStreetMap"
        }
    )
    .addTo(
        state.map
    );
}


function buildMapLayer() {

    if (
        state.geoLayer
    ) {

        state.map.removeLayer(
            state.geoLayer
        );
    }


    state.layerByCode.clear();


    const dataMap =
        new Map(
            state.anoData.map(
                row => [
                    String(
                        row.codigo_ibge
                    ),
                    row
                ]
            )
        );


    const key =
        getIndicatorKey();


    state.geoLayer =
        L.geoJSON(
            state.geojson,
            {

                style:
                    feature => {

                        const code =
                            String(
                                feature
                                .properties
                                .codigo_ibge
                            );


                        const row =
                            dataMap.get(
                                code
                            );


                        const value =
                            row
                            ? row[key]
                            : null;


                        return {

                            fillColor:
                                getColor(
                                    value
                                ),

                            fillOpacity:
                                .9,

                            color:
                                "#4a5158",

                            weight:
                                .8,

                            opacity:
                                1
                        };
                    },


                onEachFeature:
                    (
                        feature,
                        layer
                    ) => {

                        const code =
                            String(
                                feature
                                .properties
                                .codigo_ibge
                            );


                        state
                            .layerByCode
                            .set(
                                code,
                                layer
                            );


                        const row =
                            dataMap.get(
                                code
                            );


                        const value =
                            row
                            ? row[key]
                            : null;


                        const municipio =
                            row
                            ? row.municipio
                            : feature
                                .properties
                                .municipio;


                        layer.bindTooltip(

                            `
                            <strong>
                                ${municipio}
                            </strong>

                            <br>

                            ${getIndicatorConfig().label}:

                            <strong>
                                ${formatValue(value)}
                            </strong>

                            <br>

                            Ano:
                            ${state.ano}
                            `,

                            {
                                sticky:
                                    true
                            }
                        );


                        layer.on(
                            "click",
                            () => {

                                selectMunicipio(
                                    code
                                );
                            }
                        );
                    }
            }
        )
        .addTo(
            state.map
        );


    if (
        !state.map._initialFitDone
    ) {

        state.map.fitBounds(
            state.geoLayer
                .getBounds(),
            {
                padding:
                    [8,8]
            }
        );


        state.map._initialFitDone =
            true;
    }
}


function highlightMunicipio() {

    state.layerByCode
        .forEach(
            layer => {

                layer.setStyle({

                    color:
                        "#4a5158",

                    weight:
                        .8
                });
            }
        );


    if (
        !state.municipioSelecionado
    ) {

        return;
    }


    const layer =
        state.layerByCode.get(
            String(
                state.municipioSelecionado
            )
        );


    if (layer) {

        layer.setStyle({

            color:
                state.config
                    .paleta
                    .selecionado,

            weight:
                3
        });


        layer.bringToFront();
    }
}



/* ==========================================================
   ANIMAÇÃO
========================================================== */

function stopAnimation() {

    state.animationRunning =
        false;


    state.animationToken += 1;


    el.mapPlay.textContent =
        "▶ Animar";


    el.mapPlay.classList.remove(
        "playing"
    );
}


async function startAnimation() {

    if (
        state.animationRunning
    ) {

        stopAnimation();

        return;
    }


    state.animationRunning =
        true;


    state.animationToken += 1;


    const token =
        state.animationToken;


    el.mapPlay.textContent =
        "⏸ Pausar";


    el.mapPlay.classList.add(
        "playing"
    );


    while (
        state.animationRunning

        &&

        token
        === state.animationToken
    ) {

        const cfg =
            getIndicatorConfig();


        let next =
            state.ano + 1;


        if (
            next > cfg.fim
        ) {

            next =
                cfg.inicio;
        }


        state.ano =
            next;


        el.ano.value =
            next;


        el.anoLabel.textContent =
            next;


        await loadYear();


        await sleep(
            state.animationDelay
        );
    }
}



/* ==========================================================
   LEGENDA
========================================================== */

function renderLegend() {

    const key =
        getIndicatorKey();


    const info =
        state.jenks[key];


    const cfg =
        getIndicatorConfig();


    if (!info) {

        el.legend.innerHTML =
            "";

        return;
    }


    let html =
        `
        <div class="legend-title">
            ${cfg.label}
        </div>
        `;


    let lower =
        0;


    info.bins.forEach(
        (
            upper,
            i
        ) => {

            const decimals =
                cfg.unidade === "%"
                ? 2
                : 0;


            const text =
                i === 0

                ? (
                    `> 0 a ${
                        formatNumber(
                            upper,
                            decimals
                        )
                    }`
                )

                : (
                    `> ${
                        formatNumber(
                            lower,
                            decimals
                        )
                    } a ${
                        formatNumber(
                            upper,
                            decimals
                        )
                    }`
                );


            html +=
                `
                <div class="legend-row">

                    <span
                        class="legend-color"
                        style="
                            background:
                            ${
                                state.config
                                    .paleta
                                    .classes[i]
                            }
                        "
                    ></span>

                    <span>
                        ${text}
                        ${cfg.unidade}
                    </span>

                </div>
                `;


            lower =
                upper;
        }
    );


    html +=
        `
        <div class="legend-row">

            <span
                class="legend-color"
                style="
                    background:
                    ${
                        state.config
                            .paleta
                            .zero
                    }
                "
            ></span>

            <span>
                Zero informado
            </span>

        </div>


        <div class="legend-row">

            <span
                class="legend-color"
                style="
                    background:
                    ${
                        state.config
                            .paleta
                            .sem_dado
                    }
                "
            ></span>

            <span>
                Sem dado
            </span>

        </div>
        `;


    el.legend.innerHTML =
        html;
}



/* ==========================================================
   MÉTRICAS ESTADUAIS
========================================================== */

function getSerieRow() {

    return (
        state.serieRS.find(
            row =>
                Number(row.ano)
                === Number(state.ano)
        )
    );
}


function getStateSeriesDefinition() {

    const key =
        getIndicatorKey();


    const mapping = {

        "area_plantada_ha": {
            field:
                "area_plantada_ha",

            label:
                "Área plantada",

            unit:
                "ha"
        },


        "area_colhida_ha": {
            field:
                "area_colhida_ha",

            label:
                "Área colhida",

            unit:
                "ha"
        },


        "quantidade_produzida_t": {
            field:
                "quantidade_produzida_t",

            label:
                "Quantidade produzida",

            unit:
                "t"
        },


        "rendimento_medio_kg_ha": {
            field:
                "rendimento_medio_rs_kg_ha",

            label:
                "Rendimento médio",

            unit:
                "kg/ha"
        },


        "valor_nominal_mil_reais": {
            field:
                "valor_nominal_mil_reais",

            label:
                "Valor nominal",

            unit:
                "R$ mil"
        },


        "valor_real_2024_mil_reais": {
            field:
                "valor_real_2024_mil_reais",

            label:
                "Valor real",

            unit:
                "R$ mil de 2024"
        },


        "pct_area_municipal_plantada": {
            field:
                "pct_area_oficial_rs_plantada_soja",

            label:
                "Área plantada ÷ território do RS",

            unit:
                "%"
        },


        "pct_area_municipal_colhida": {
            field:
                "pct_area_oficial_rs_colhida_soja",

            label:
                "Área colhida ÷ território do RS",

            unit:
                "%"
        }
    };


    return mapping[key];
}


function getStateMetric() {

    const row =
        getSerieRow();


    if (!row) {

        return null;
    }


    const def =
        getStateSeriesDefinition();


    return (
        row[
            def.field
        ]
    );
}


function getPctTerritorioRS() {

    const row =
        getSerieRow();


    if (!row) {

        return null;
    }


    if (
        state.indicator
        === "area_plantada"
    ) {

        return (
            row[
                "pct_area_oficial_rs_plantada_soja"
            ]
        );
    }


    if (
        state.indicator
        === "area_colhida"
    ) {

        return (
            row[
                "pct_area_oficial_rs_colhida_soja"
            ]
        );
    }


    return null;
}



/* ==========================================================
   CARDS
========================================================== */

function renderCards() {

    const key =
        getIndicatorKey();


    const cfg =
        getIndicatorConfig();


    const valid =
        state.anoData
            .map(
                row =>
                    row[key]
            )
            .filter(
                value =>
                    value !== null
                    &&
                    value !== undefined
                    &&
                    !Number.isNaN(
                        Number(value)
                    )
            )
            .map(Number);


    const mean =
        valid.length

        ? (
            valid.reduce(
                (a,b) =>
                    a+b,
                0
            )
            /
            valid.length
        )

        : null;


    let median =
        null;


    if (
        valid.length
    ) {

        const ordered =
            [...valid]
            .sort(
                (a,b) =>
                    a-b
            );


        const mid =
            Math.floor(
                ordered.length
                /
                2
            );


        median =
            ordered.length % 2

            ? ordered[mid]

            : (
                ordered[mid-1]
                +
                ordered[mid]
            ) / 2;
    }


    const total =
        getStateMetric();


    const pctRS =
        getPctTerritorioRS();


    if (
        cfg.unidade
        === "%"
    ) {

        el.cardTotalLabel
            .textContent =
                "Área de soja ÷ território do RS";


        el.cardTotalNote
            .textContent =
                "equivalência territorial estadual";


        el.cardTotal.textContent =
            total === null
            ||
            total === undefined

            ? "—"

            : (
                formatNumber(
                    total,
                    2
                )
                +
                "%"
            );

    } else {

        el.cardTotalLabel
            .textContent =
                "Total no Rio Grande do Sul";


        el.cardTotalNote
            .textContent =
                unitExplanation(
                    key
                );


        el.cardTotal.textContent =
            formatValue(
                total,
                key
            );
    }


    el.cardMedia.textContent =
        formatValue(
            mean,
            key
        );


    el.cardMediana.textContent =
        formatValue(
            median,
            key
        );


    el.cardValidos.textContent =
        formatNumber(
            valid.length,
            0
        );


    el.cardPctRS.textContent =
        (
            pctRS === null
            ||
            pctRS === undefined
        )

        ? "—"

        : (
            formatNumber(
                pctRS,
                2
            )
            +
            "%"
        );
}



/* ==========================================================
   RANKING
========================================================== */

function renderRanking() {

    const key =
        getIndicatorKey();


    const rows =
        state.anoData
            .filter(
                row =>
                    row[key] !== null
                    &&
                    row[key] !== undefined
                    &&
                    !Number.isNaN(
                        Number(row[key])
                    )
            )
            .sort(
                (a,b) =>
                    Number(b[key])
                    -
                    Number(a[key])
            );


    state.currentRows =
        rows;


    if (
        !rows.length
    ) {

        el.ranking.innerHTML =
            `
            <p style="
                color:#66717e;
                padding:10px;
            ">
                Sem dados para este período.
            </p>
            `;

        return;
    }


    const maxValue =
        Math.max(
            ...rows.map(
                row =>
                    Number(row[key])
            )
        );


    el.ranking.innerHTML =
        rows.map(
            (
                row,
                index
            ) => {

                const value =
                    Number(
                        row[key]
                    );


                const pct =
                    maxValue > 0

                    ? (
                        value
                        /
                        maxValue
                        *
                        100
                    )

                    : 0;


                return `
                <div
                    class="rank-item"
                    data-code="${row.codigo_ibge}"
                >

                    <div class="rank-top">

                        <span class="rank-position">
                            ${index+1}
                        </span>

                        <span class="rank-name">
                            ${row.municipio}
                        </span>

                        <span class="rank-value">
                            ${formatValue(value)}
                        </span>

                    </div>


                    <div class="rank-track">

                        <div
                            class="rank-bar"
                            style="
                                width:${pct}%;
                            "
                        ></div>

                    </div>

                </div>
                `;
            }
        )
        .join("");


    document
        .querySelectorAll(
            ".rank-item"
        )
        .forEach(
            node => {

                node.addEventListener(
                    "click",
                    () => {

                        selectMunicipio(
                            node.dataset.code
                        );
                    }
                );
            }
        );
}



/* ==========================================================
   TABELA
========================================================== */

function renderTable() {

    const search =
        el.tableSearch
            .value
            .trim()
            .toLocaleLowerCase(
                "pt-BR"
            );


    const key =
        getIndicatorKey();


    const ordered =
        [...state.anoData]
        .sort(
            (a,b) => {

                const av =
                    a[key];

                const bv =
                    b[key];


                if (
                    av === null
                    &&
                    bv === null
                ) {

                    return 0;
                }


                if (
                    av === null
                ) {

                    return 1;
                }


                if (
                    bv === null
                ) {

                    return -1;
                }


                return (
                    Number(bv)
                    -
                    Number(av)
                );
            }
        );


    let rank =
        0;


    const filtered =
        ordered.filter(
            row =>
                !search
                ||
                String(
                    row.municipio
                )
                .toLocaleLowerCase(
                    "pt-BR"
                )
                .includes(
                    search
                )
        );


    el.tableBody.innerHTML =
        filtered.map(
            row => {

                const value =
                    row[key];


                if (
                    value !== null
                    &&
                    value !== undefined
                ) {

                    rank += 1;
                }


                return `
                <tr
                    data-code="${row.codigo_ibge}"
                >

                    <td>
                        ${
                            value === null
                            ||
                            value === undefined

                            ? "—"

                            : rank
                        }
                    </td>

                    <td>
                        ${row.municipio}
                    </td>

                    <td>
                        ${row.codigo_ibge}
                    </td>

                    <td>
                        ${formatValue(value)}
                    </td>

                </tr>
                `;
            }
        )
        .join("");


    document
        .querySelectorAll(
            "#table-body tr"
        )
        .forEach(
            node => {

                node.addEventListener(
                    "click",
                    () => {

                        selectMunicipio(
                            node.dataset.code
                        );
                    }
                );
            }
        );
}



/* ==========================================================
   REGRESSÃO LINEAR
========================================================== */

function linearRegression(
    x,
    y
) {

    const pairs =
        x
            .map(
                (
                    year,
                    i
                ) => ({
                    x:
                        Number(year),

                    y:
                        y[i] === null
                        ||
                        y[i] === undefined

                        ? null

                        : Number(y[i])
                })
            )
            .filter(
                p =>
                    p.y !== null
                    &&
                    Number.isFinite(
                        p.y
                    )
            );


    if (
        pairs.length < 2
    ) {

        return null;
    }


    const n =
        pairs.length;


    const sx =
        pairs.reduce(
            (s,p) =>
                s+p.x,
            0
        );


    const sy =
        pairs.reduce(
            (s,p) =>
                s+p.y,
            0
        );


    const sxy =
        pairs.reduce(
            (s,p) =>
                s+p.x*p.y,
            0
        );


    const sxx =
        pairs.reduce(
            (s,p) =>
                s+p.x*p.x,
            0
        );


    const denominator =
        n*sxx
        -
        sx*sx;


    if (
        denominator === 0
    ) {

        return null;
    }


    const slope =
        (
            n*sxy
            -
            sx*sy
        )
        /
        denominator;


    const intercept =
        (
            sy
            -
            slope*sx
        )
        /
        n;


    return {

        slope,
        intercept,

        predict:
            year =>
                intercept
                +
                slope*Number(year)
    };
}



/* ==========================================================
   ESCALA DOS GRÁFICOS MONETÁRIOS
========================================================== */

function plotScale(
    values,
    key
) {

    const cfg =
        state.config
            .indicadores[key];


    if (
        !cfg.unidade
            .includes("R$ mil")
    ) {

        return {

            divisor:
                1,

            unit:
                cfg.unidade
        };
    }


    const valid =
        values
            .filter(
                v =>
                    v !== null
                    &&
                    v !== undefined
                    &&
                    Number.isFinite(
                        Number(v)
                    )
            )
            .map(Number);


    const max =
        valid.length
        ? Math.max(
            ...valid
        )
        : 0;


    const reais =
        max * 1000;


    if (
        reais
        >= 1_000_000_000
    ) {

        return {

            divisor:
                1_000_000,

            unit:
                "R$ bilhões"
        };
    }


    return {

        divisor:
            1000,

        unit:
            "R$ milhões"
    };
}



/* ==========================================================
   SÉRIE ESTADUAL
========================================================== */

function renderStateChart() {

    const def =
        getStateSeriesDefinition();


    const key =
        getIndicatorKey();


    const cfg =
        getIndicatorConfig();


    const rows =
        state.serieRS
            .filter(
                row =>
                    Number(row.ano)
                    >= Number(cfg.inicio)

                    &&

                    Number(row.ano)
                    <= Number(cfg.fim)
            );


    const x =
        rows.map(
            row =>
                Number(row.ano)
        );


    const raw =
        rows.map(
            row =>
                row[
                    def.field
                ]
        );


    const scale =
        plotScale(
            raw,
            key
        );


    const y =
        raw.map(
            v =>
                v === null
                ||
                v === undefined

                ? null

                : Number(v)
                    /
                    scale.divisor
        );


    const valid =
        raw
            .filter(
                v =>
                    v !== null
                    &&
                    v !== undefined
                    &&
                    Number.isFinite(
                        Number(v)
                    )
            )
            .map(Number);


    const meanRaw =
        valid.length

        ? (
            valid.reduce(
                (a,b) =>
                    a+b,
                0
            )
            /
            valid.length
        )

        : null;


    const regression =
        linearRegression(
            x,
            raw
        );


    const traces = [

        {
            x,
            y,

            type:
                "scatter",

            mode:
                "lines+markers",

            name:
                def.label,

            line: {
                width:
                    2.6
            },

            marker: {
                size:
                    6
            },

            text:
                raw.map(
                    (
                        value,
                        i
                    ) =>
                        `${
                            x[i]
                        }<br>${
                            def.label
                        }: ${
                            formatValue(
                                value,
                                key
                            )
                        }`
                ),

            hovertemplate:
                "%{text}<extra></extra>",

            connectgaps:
                false
        }
    ];


    if (
        meanRaw !== null
    ) {

        traces.push({

            x:
                [
                    x[0],
                    x[x.length-1]
                ],

            y:
                [
                    meanRaw
                    /
                    scale.divisor,

                    meanRaw
                    /
                    scale.divisor
                ],

            type:
                "scatter",

            mode:
                "lines",

            name:
                "Média histórica",

            line: {

                dash:
                    "dot",

                width:
                    1.7
            },

            hoverinfo:
                "skip"
        });
    }


    if (
        regression
    ) {

        traces.push({

            x,

            y:
                x.map(
                    year =>
                        regression
                            .predict(year)
                        /
                        scale.divisor
                ),

            type:
                "scatter",

            mode:
                "lines",

            name:
                "Tendência linear",

            line: {

                dash:
                    "dash",

                width:
                    1.7
            },

            hoverinfo:
                "skip"
        });
    }


    Plotly.react(

        "chart-state",

        traces,

        {

            margin: {
                l:70,
                r:20,
                t:20,
                b:55
            },

            xaxis: {

                title:
                    "Ano",

                gridcolor:
                    "#eef1f4"
            },

            yaxis: {

                title:
                    scale.unit,

                gridcolor:
                    "#eef1f4"
            },

            paper_bgcolor:
                "white",

            plot_bgcolor:
                "white",

            legend: {

                orientation:
                    "h",

                y:
                    1.1,

                x:
                    0
            },

            hovermode:
                "x unified"
        },

        {
            responsive:
                true,

            displaylogo:
                false
        }
    );


    el.stateChartSubtitle
        .textContent =
            `${def.label} — `
            +
            `${cfg.inicio}–${cfg.fim} | `
            +
            unitExplanation(key);
}



/* ==========================================================
   SÉRIE MUNICIPAL
========================================================== */

async function renderMunicipalChart() {

    if (
        !state.municipioSelecionado
    ) {

        Plotly.purge(
            "chart-municipio"
        );


        el.municipalChartTitle
            .textContent =
                "Evolução municipal";


        el.municipalChartSubtitle
            .textContent =
                "Selecione um município no mapa, ranking ou tabela";


        return;
    }


    const code =
        state.municipioSelecionado;


    const rows =
        await loadJSON(
            `data/municipios/${code}.json`
        );


    const key =
        getIndicatorKey();


    const cfg =
        getIndicatorConfig();


    const municipality =
        state.municipiosIndex
            .find(
                item =>
                    String(
                        item.codigo_ibge
                    )
                    ===
                    String(code)
            );


    const filtered =
        rows.filter(
            row =>
                Number(row.ano)
                >= Number(cfg.inicio)

                &&

                Number(row.ano)
                <= Number(cfg.fim)
        );


    const x =
        filtered.map(
            row =>
                Number(row.ano)
        );


    const raw =
        filtered.map(
            row =>
                row[key]
        );


    const scale =
        plotScale(
            raw,
            key
        );


    const y =
        raw.map(
            v =>
                v === null
                ||
                v === undefined

                ? null

                : Number(v)
                    /
                    scale.divisor
        );


    const valid =
        raw
            .filter(
                v =>
                    v !== null
                    &&
                    v !== undefined
                    &&
                    Number.isFinite(
                        Number(v)
                    )
            )
            .map(Number);


    const meanRaw =
        valid.length

        ? (
            valid.reduce(
                (a,b) =>
                    a+b,
                0
            )
            /
            valid.length
        )

        : null;


    const regression =
        linearRegression(
            x,
            raw
        );


    const traces = [

        {
            x,
            y,

            type:
                "scatter",

            mode:
                "lines+markers",

            name:
                cfg.label,

            line: {
                width:
                    2.6
            },

            marker: {
                size:
                    6
            },

            text:
                raw.map(
                    (
                        value,
                        i
                    ) =>
                        `${
                            x[i]
                        }<br>${
                            cfg.label
                        }: ${
                            formatValue(
                                value,
                                key
                            )
                        }`
                ),

            hovertemplate:
                "%{text}<extra></extra>",

            connectgaps:
                false
        }
    ];


    if (
        meanRaw !== null
    ) {

        traces.push({

            x:
                [
                    x[0],
                    x[x.length-1]
                ],

            y:
                [
                    meanRaw
                    /
                    scale.divisor,

                    meanRaw
                    /
                    scale.divisor
                ],

            type:
                "scatter",

            mode:
                "lines",

            name:
                "Média histórica",

            line: {

                dash:
                    "dot",

                width:
                    1.7
            },

            hoverinfo:
                "skip"
        });
    }


    if (
        regression
    ) {

        traces.push({

            x,

            y:
                x.map(
                    year =>
                        regression
                            .predict(year)
                        /
                        scale.divisor
                ),

            type:
                "scatter",

            mode:
                "lines",

            name:
                "Tendência linear",

            line: {

                dash:
                    "dash",

                width:
                    1.7
            },

            hoverinfo:
                "skip"
        });
    }


    Plotly.react(

        "chart-municipio",

        traces,

        {

            margin: {
                l:70,
                r:20,
                t:20,
                b:55
            },

            xaxis: {

                title:
                    "Ano",

                gridcolor:
                    "#eef1f4"
            },

            yaxis: {

                title:
                    scale.unit,

                gridcolor:
                    "#eef1f4"
            },

            paper_bgcolor:
                "white",

            plot_bgcolor:
                "white",

            legend: {

                orientation:
                    "h",

                y:
                    1.1,

                x:
                    0
            },

            hovermode:
                "x unified"
        },

        {
            responsive:
                true,

            displaylogo:
                false
        }
    );


    el.municipalChartTitle
        .textContent =
            municipality
            ? municipality.municipio
            : "Município";


    el.municipalChartSubtitle
        .textContent =
            `${cfg.label} | `
            +
            unitExplanation(key);
}



/* ==========================================================
   COMPARAÇÃO POR COORTE
========================================================== */

function renderGovernmentChart() {

    const def =
        getStateSeriesDefinition();


    const key =
        getIndicatorKey();


    const cfg =
        getIndicatorConfig();


    const rows =
        state.serieRS
            .filter(
                row =>

                    Number(row.ano)
                    >= Number(cfg.inicio)

                    &&

                    Number(row.ano)
                    <= Number(cfg.fim)

                    &&

                    row.coorte_gestao
            );


    const groups =
        new Map();


    rows.forEach(
        row => {

            const name =
                row.coorte_gestao;


            const value =
                row[
                    def.field
                ];


            if (
                !groups.has(name)
            ) {

                groups.set(
                    name,
                    {
                        name,
                        years: [],
                        values: []
                    }
                );
            }


            const g =
                groups.get(name);


            g.years.push(
                Number(row.ano)
            );


            if (
                value !== null
                &&
                value !== undefined
                &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                g.values.push(
                    Number(value)
                );
            }
        }
    );


    const data =
        Array.from(
            groups.values()
        )
        .map(
            g => ({

                name:
                    g.name,

                start:
                    Math.min(
                        ...g.years
                    ),

                end:
                    Math.max(
                        ...g.years
                    ),

                n:
                    g.values.length,

                mean:
                    g.values.length

                    ? (
                        g.values.reduce(
                            (a,b) =>
                                a+b,
                            0
                        )
                        /
                        g.values.length
                    )

                    : null
            })
        )
        .filter(
            g =>
                g.mean !== null
        )
        .sort(
            (a,b) =>
                a.start
                -
                b.start
        );


    const raw =
        data.map(
            g =>
                g.mean
        );


    const scale =
        plotScale(
            raw,
            key
        );


    const labels =
        data.map(
            g =>
                `${g.name}<br>`
                +
                `${g.start}–${g.end}`
                +
                ` (${g.n} anos observados)`
        );


    Plotly.react(

        "chart-governos",

        [

            {
                x:
                    raw.map(
                        v =>
                            v
                            /
                            scale.divisor
                    ),

                y:
                    labels,

                type:
                    "bar",

                orientation:
                    "h",

                text:
                    data.map(
                        g =>
                            formatValue(
                                g.mean,
                                key
                            )
                    ),

                textposition:
                    "auto",

                hovertemplate:
                    "%{y}<br>"
                    +
                    "Média anual: %{text}"
                    +
                    "<extra></extra>"
            }
        ],

        {

            margin: {
                l:205,
                r:35,
                t:20,
                b:55
            },

            xaxis: {

                title:
                    `Média anual — ${scale.unit}`,

                gridcolor:
                    "#eef1f4"
            },

            yaxis: {

                autorange:
                    "reversed",

                automargin:
                    true
            },

            paper_bgcolor:
                "white",

            plot_bgcolor:
                "white",

            showlegend:
                false
        },

        {
            responsive:
                true,

            displaylogo:
                false
        }
    );


    el.governmentChartSubtitle
        .textContent =
            `${def.label} — média anual dentro de cada coorte | `
            +
            `${unitExplanation(key)}`;
}



/* ==========================================================
   EXPANSÃO TERRITORIAL ESTADUAL
========================================================== */

function renderTerritoryChart() {

    const rows =
        state.serieRS;


    const x =
        rows.map(
            row =>
                Number(row.ano)
        );


    const planted =
        rows.map(
            row =>
                row[
                    "pct_area_oficial_rs_plantada_soja"
                ]
        );


    const harvested =
        rows.map(
            row =>
                row[
                    "pct_area_oficial_rs_colhida_soja"
                ]
        );


    Plotly.react(

        "chart-territorio",

        [

            {
                x,
                y:
                    planted,

                type:
                    "scatter",

                mode:
                    "lines+markers",

                name:
                    "Área plantada",

                connectgaps:
                    false,

                hovertemplate:
                    "%{x}<br>"
                    +
                    "Área plantada: %{y:.2f}%"
                    +
                    "<extra></extra>"
            },


            {
                x,
                y:
                    harvested,

                type:
                    "scatter",

                mode:
                    "lines+markers",

                name:
                    "Área colhida",

                connectgaps:
                    false,

                hovertemplate:
                    "%{x}<br>"
                    +
                    "Área colhida: %{y:.2f}%"
                    +
                    "<extra></extra>"
            }

        ],

        {

            margin: {
                l:65,
                r:20,
                t:20,
                b:55
            },

            xaxis: {

                title:
                    "Ano",

                gridcolor:
                    "#eef1f4"
            },

            yaxis: {

                title:
                    "% do território do RS",

                ticksuffix:
                    "%",

                gridcolor:
                    "#eef1f4"
            },

            legend: {

                orientation:
                    "h",

                y:
                    1.1
            },

            paper_bgcolor:
                "white",

            plot_bgcolor:
                "white",

            hovermode:
                "x unified"
        },

        {
            responsive:
                true,

            displaylogo:
                false
        }
    );
}



/* ==========================================================
   MUNICÍPIO
========================================================== */

async function selectMunicipio(
    code
) {

    state.municipioSelecionado =
        String(code);


    el.municipio.value =
        String(code);


    highlightMunicipio();


    await renderMunicipalChart();
}


function populateMunicipioSelect() {

    const options =
        state.municipiosIndex
            .map(
                row =>
                    `
                    <option value="${row.codigo_ibge}">
                        ${row.municipio}
                    </option>
                    `
            )
            .join("");


    el.municipio
        .insertAdjacentHTML(
            "beforeend",
            options
        );
}



/* ==========================================================
   LIMITES DE ANO
========================================================== */

function updateYearLimits() {

    const cfg =
        getIndicatorConfig();


    el.ano.min =
        cfg.inicio;


    el.ano.max =
        cfg.fim;


    if (
        state.ano
        < cfg.inicio
    ) {

        state.ano =
            cfg.inicio;
    }


    if (
        state.ano
        > cfg.fim
    ) {

        state.ano =
            cfg.fim;
    }


    el.ano.value =
        state.ano;


    el.anoLabel.textContent =
        state.ano;
}



/* ==========================================================
   AVISOS
========================================================== */

function renderNotice() {

    const key =
        getIndicatorKey();


    if (
        key
        === "pct_area_municipal_plantada"

        ||

        key
        === "pct_area_municipal_colhida"
    ) {

        el.aviso
            .classList
            .remove(
                "hidden"
            );


        el.aviso.textContent =
            "Percentuais municipais são exibidos somente para 2013–2024, período adotado como territorialmente comparável com a malha municipal de 2024.";

    } else {

        el.aviso
            .classList
            .add(
                "hidden"
            );
    }
}



/* ==========================================================
   TÍTULOS
========================================================== */

function renderTitles() {

    const cfg =
        getIndicatorConfig();


    el.mapTitle.textContent =
        cfg.label;


    el.mapSubtitle.textContent =
        `Rio Grande do Sul — ${state.ano} | `
        +
        unitExplanation();


    el.rankingSubtitle.textContent =
        `${cfg.label} — ${state.ano}`;


    el.tableSubtitle.textContent =
        `${cfg.label} — ${state.ano}`;


    el.tableValueHeader.textContent =
        `${cfg.label} (${cfg.unidade})`;
}



/* ==========================================================
   CARREGAR ANO
========================================================== */

async function loadYear() {

    state.anoData =
        await loadJSON(
            `data/anos/${state.ano}.json`
        );


    renderTitles();

    renderNotice();

    buildMapLayer();

    renderLegend();

    renderCards();

    renderRanking();

    renderTable();

    renderStateChart();

    renderGovernmentChart();

    await renderMunicipalChart();

    highlightMunicipio();
}



/* ==========================================================
   CSV
========================================================== */

function downloadCSV() {

    const key =
        getIndicatorKey();


    const cfg =
        getIndicatorConfig();


    const rows =
        state.anoData.map(
            row => ({

                codigo_ibge:
                    row.codigo_ibge,

                municipio:
                    row.municipio,

                ano:
                    row.ano,

                indicador:
                    cfg.label,

                unidade:
                    cfg.unidade,

                valor:
                    row[key]
            })
        );


    const columns =
        [
            "codigo_ibge",
            "municipio",
            "ano",
            "indicador",
            "unidade",
            "valor"
        ];


    const lines =
        [
            columns.join(";")
        ];


    rows.forEach(
        row => {

            const values =
                columns.map(
                    col => {

                        const value =
                            row[col];


                        if (
                            value === null
                            ||
                            value === undefined
                        ) {

                            return "";
                        }


                        return (
                            '"'
                            +
                            String(value)
                                .replaceAll(
                                    '"',
                                    '""'
                                )
                            +
                            '"'
                        );
                    }
                );


            lines.push(
                values.join(";")
            );
        }
    );


    const blob =
        new Blob(
            [
                "\ufeff"
                +
                lines.join("\n")
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href =
        url;


    a.download =
        `soja_rs_${key}_${state.ano}.csv`;


    document.body.appendChild(
        a
    );


    a.click();


    a.remove();


    URL.revokeObjectURL(
        url
    );
}



/* ==========================================================
   EVENTOS
========================================================== */

function bindEvents() {

    el.indicador.addEventListener(
        "change",
        async () => {

            stopAnimation();


            state.indicator =
                el.indicador.value;


            const area =
                isAreaIndicator();


            el.grupoGrandeza
                .classList
                .toggle(
                    "hidden",
                    !area
                );


            if (!area) {

                state.grandeza =
                    "ha";
            }


            updateYearLimits();


            await loadYear();
        }
    );


    el.grandeza.addEventListener(
        "change",
        async () => {

            stopAnimation();


            state.grandeza =
                el.grandeza.value;


            updateYearLimits();


            await loadYear();
        }
    );


    el.ano.addEventListener(
        "input",
        () => {

            el.anoLabel.textContent =
                el.ano.value;
        }
    );


    el.ano.addEventListener(
        "change",
        async () => {

            stopAnimation();


            state.ano =
                Number(
                    el.ano.value
                );


            await loadYear();
        }
    );


    el.municipio.addEventListener(
        "change",
        async () => {

            const code =
                el.municipio.value;


            if (!code) {

                state.municipioSelecionado =
                    null;


                highlightMunicipio();


                await renderMunicipalChart();


                return;
            }


            await selectMunicipio(
                code
            );
        }
    );


    el.tableSearch.addEventListener(
        "input",
        renderTable
    );


    el.downloadCsv.addEventListener(
        "click",
        downloadCSV
    );


    el.mapPlay.addEventListener(
        "click",
        startAnimation
    );


    el.animationSpeed.addEventListener(
        "change",
        () => {

            state.animationDelay =
                Number(
                    el.animationSpeed.value
                );
        }
    );
}



/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

async function init() {

    try {

        [

            state.config,
            state.jenks,
            state.geojson,
            state.serieRS,
            state.municipiosIndex

        ] = await Promise.all(

            [

                loadJSON(
                    "data/indicadores.json"
                ),

                loadJSON(
                    "data/jenks_breaks.json"
                ),

                loadJSON(
                    "data/municipios_rs_2024.geojson"
                ),

                loadJSON(
                    "data/serie_rs.json"
                ),

                loadJSON(
                    "data/municipios_index.json"
                )

            ]
        );


        populateMunicipioSelect();


        initializeMap();


        bindEvents();


        updateYearLimits();


        renderTerritoryChart();


        await loadYear();


        console.log(
            "Painel V2 carregado."
        );


    } catch(error) {

        console.error(
            error
        );


        document.body
            .insertAdjacentHTML(

                "afterbegin",

                `
                <div style="
                    background:#8b0000;
                    color:white;
                    padding:14px 20px;
                    font-family:sans-serif;
                ">

                    Erro ao carregar o painel V2:
                    ${error.message}

                </div>
                `
            );
    }
}


init();
