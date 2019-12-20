import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex, axios);

export default new Vuex.Store({
  state: {
    rowData: []
  },

  actions: {
    loadFiles({ commit }) {
      axios({
        method: "get",
        url: "/list",
        responseType: "json",
        headers: {}
      })
        .then(response => {
          console.log(response);
          let rowData = response.data;
          console.log(rowData);
          commit("SET_FILES", rowData);
        })
        .catch(error => {
          commit("SET_FILES", rowData);
          console.log(error);
        });
    },

    postFile({ dispatch, commit }, newFile) {
      const config = {
        onUploadProgress(e) {
          var percentCompleted = Math.round((e.loaded * 5000) / e.total);
        }
      };
      try {
        axios
          .post("/", newFile, config, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          })
          .then(res => {
            commit("POST_FILE", newFile);
            console.log(res);
          })
          .then(res => {
            dispatch("loadFiles");
            console.log(res);
          });
      } catch (error) {
        console.log(error);
      }
    },

    deleteFile({ dispatch }, result_id) {
      axios
        .delete(`/${result_id}`)
        .then(res => {
          console.log(res);
          dispatch("loadFiles");
        })
        .catch(error => {
          console.log(error);
        });
    },

    downloadFile({ dispatch }, fileParams) {
      axios({
        url: `/${fileParams.fileId}`, //#!!#
        method: "GET",
        responseType: "blob"
      }).then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileParams.fileName);
        document.body.appendChild(link);
        link.click();
        console.log(dispatch);
      });
    }
  },

  mutations: {
    SET_FILES(state, files) {
      state.rowData = files;
    },
    POST_FILE(state, newFile) {
      state.rowData.push(newFile);
    }
  }
});
