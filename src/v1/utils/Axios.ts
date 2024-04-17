import axios from "axios";
import rax from "retry-axios";

export const ax = axios.create({
    timeout: 5000,
});
ax.defaults.raxConfig = {
    instance: ax,
};
rax.attach(ax);
