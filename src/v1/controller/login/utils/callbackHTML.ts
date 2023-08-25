export const successHTML = (needLaunchApp: boolean, isBinding = false): string => {
    const launchAppCode = needLaunchApp
        ? `setTimeout(() => {
            location.href = "x-agora-flat-client://open"
        }, 1000 * 3)`
        : "";

    return `<!doctype html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${isBinding ? "Binding Success" : "Login Success"}</title>
            </head>
            <body>
                <svg style=max-width:80px;max-height:80px;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 0c22.0914 0 40 17.9086 40 40S62.0914 80 40 80 0 62.0914 0 40 17.9086 0 40 0zm0 4C20.1177 4 4 20.1177 4 40s16.1177 36 36 36 36-16.1177 36-36S59.8823 4 40 4zm22.6337 20.5395l2.7326 2.921-32.3889 30.2993L14.61 40.0046l2.78-2.876L33.022 52.24l29.6117-27.7005z" fill="#9FDF76" fill-rule="nonzero" />
                </svg>
                <div id="text" style=position:fixed;top:65%;left:50%;transform:translate(-50%,-50%)>
                    Success, please close this page
                </div>
            </body>
            <script>
                ${launchAppCode}
            </script>
            </html>
        `;
};

export const failedHTML = (isBinding = false): string => {
    return `<!doctype html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${isBinding ? "Binding Failed" : "Login Failed"}</title>
            </head>
            <body>
                <svg style=max-width:80px;max-height:80px;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 0c22.0914 0 40 17.9086 40 40S62.0914 80 40 80 0 62.0914 0 40 17.9086 0 40 0zm0 4C20.1177 4 4 20.1177 4 40s16.1177 36 36 36 36-16.1177 36-36S59.8823 4 40 4zm21.0572 49.2345l.357.3513-2.8284 2.8284c-10.162-10.162-26.5747-10.2636-36.8617-.3048l-.3099.3048-2.8284-2.8284c11.7085-11.7085 30.619-11.8256 42.4714-.3513zM27 26c2.2091 0 4 1.7909 4 4 0 2.2091-1.7909 4-4 4-2.2091 0-4-1.7909-4-4 0-2.2091 1.7909-4 4-4zm26 0c2.2091 0 4 1.7909 4 4 0 2.2091-1.7909 4-4 4-2.2091 0-4-1.7909-4-4 0-2.2091 1.7909-4 4-4z" fill="#F45454" fill-rule="nonzero" />
                </svg>
                <div id="text" style=position:fixed;top:65%;left:50%;transform:translate(-50%,-50%)>
                    Failed, please try again
                </div>
            </body>
            </html>
        `;
};
