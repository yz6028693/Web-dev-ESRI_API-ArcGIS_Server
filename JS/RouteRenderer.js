var RouteRenderer = {
    type: "unique-value", 
    field: "Division",
    defaultSymbol: {
        type: "simple-line",
        width: 1.5,
        color: [102, 102, 153, 0.8],
        style: "short-dot"
    },
    defaultLabel: "Other major SubWays",
    uniqueValueInfos: [{
        value: "IND",
        symbol: {
            type: "simple-line", 
            width: 1.5,
            color: [0, 153, 255, 0.7],
            style: "short-dot"
            
        },
        label: "SubWay 1"
    }, {
        value: "IRT", 
        symbol: {
            type: "simple-line",
            width: 1.5,
            color: [255, 80, 80, 0.7],
            style: "short-dot"
        },
        label: "SubWay 2"
    }, {
        value: "BMT",
        symbol: {
            type: "simple-line",
            width: 1.5,
            color: [255, 204, 102, 0.7],
            style: "short-dot"
        },
        label: "SubWay 3"
    }, {
        value: "Air",
        symbol: {
            type: "simple-line",
            width: 1.5,
            color: [102, 255, 102, 0.7],
            style: "short-dot"
        },
        label: "SubWay 4"
    }
    ]
    };