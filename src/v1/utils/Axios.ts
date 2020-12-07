import axios from "axios";
import rax from "retry-axios";

export const ax = axios.create();
ax.defaults.raxConfig = {
    instance: ax,
};
rax.attach(ax);
