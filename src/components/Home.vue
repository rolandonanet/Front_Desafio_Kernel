<template>
  <b-container>
    <br />

    <!-- PART-2: UPLOAD A FILE -->
    <b-card bg-variant="light">
      <b-form-file
        v-model="selFile"
        ref="form"
        placeholder="Solte o arquivo aqui..."
      />
      <b-button variant="primary" @click="submitFile()">
        Enviar &nbsp; &nbsp;<font-awesome-icon icon="upload"
      /></b-button>
    </b-card>

    <br />

    <!-- PART-3: DELETE FILE(S) -->
    <b-card bg-variant="light">
      <b-row>
        <b-col col="4"
          ><b-button variant="danger" @click="deleteFile()">
            Deletar &nbsp;&nbsp;<font-awesome-icon icon="trash-alt"
          /></b-button>
        </b-col>
        <b-col cols="4" md="auto">
          <b-card bg-variant="light" v-if="status">
            <b-card-text style="margin-right: 50px;">
              <strong>{{ selectedDataSizes.length }}</strong> Arquivo(s) selecionados</b-card-text
            >
            <b-card-text
              >Tamanho total: <strong>{{ selectedDataTotal }}</strong></b-card-text
            >
          </b-card>
        </b-col>
      </b-row>

      <hr />

      <!-- PART-1: LIST FILES -->
      <ag-grid-vue
        style="width: 100%; height: 500px; border: 1px solid #e7e9ea; border-radius: 4px;"
        class="ag-theme-material"
        :row-height="60"
        :columnDefs="columnDefs"
        :gridOptions="gridOptions"
        :autoGroupColumnDef="autoGroupColumnDef"
        :frameworkComponents="frameworkComponents"
        :suppressRowClickSelection="true"
        :groupSelectsChildren="true"
        :debug="true"
        :rowSelection="rowSelection"
        :defaultColDef="{
          enableValue: false,
          sortable: true,
          resizable: true,
          filter: true
        }"
        :enableRangeSelection="true"
        animateRows
        @rowClicked="onRowClicked"
        @rowSelected="onRowSelected"
        :paginationAutoPageSize="true"
        :pagination="true"
        @gridReady="onGridReady"
        :rowData="rowData"
      >
      </ag-grid-vue>
    </b-card>

    <!-- PART-3: DELETE FILE(S) -->
    <!-- Modal Component -->
    <b-modal
      v-if="mShow"
      v-model="modal"
      @ok="handleOk"
      @cancel="$emit('close')"
    >
      Deseja deletar o arquivo selecionado?
    </b-modal>
  </b-container>
</template>

<script>
import { AgGridVue } from "ag-grid-vue";
import { mapState } from "vuex";
import { sizeFormatter } from "../utils";
export default {
  data() {
    return {
      selFile: null,
      columnDefs: null,
      autoGroupColumnDef: null,
      frameworkComponents: null,
      rowSelection: null,
      gridOptions: {},
      modal: false,
      mShow: false,
      result_id: null,
      status: false,
      selectedDataSizes: [],
      selectedDataTotal: 0
    };
  },
  components: {
    AgGridVue
  },
  beforeMount() {
    this.columnDefs = [
      {
        headerName: "Nome",
        field: "name",
        width: 500,
        filterParams: { newRowsAction: "keep" },
        checkboxSelection: params => {
        return params.columnApi.getRowGroupColumns().length === 0;
         },
         headerCheckboxSelection: function(params) {
           return params.columnApi.getRowGroupColumns().length === 0;
         }
      },
      {
        headerName: "Tipo",
        field: "filetype",
        width: 90,
        filterParams: { newRowsAction: "keep" }
      },
      {
        headerName: "Tamanho",
        field: "size",
        valueFormatter: sizeFormatter,
        width: 90,
        filterParams: { newRowsAction: "keep" }
      },
      {
        headerName: "Data do envio",
        field: "since_added",
        width: 90,
        sort: "desc"
      }
    ];
    this.autoGroupColumnDef = {
      headerName: "Group",
      width: 250,
      field: "name",
      valueGetter: params => {
        if (params.node.group) {
          return params.node.key;
        } else {
          return params.data[params.colDef.field];
        }
      },
      headerCheckboxSelection: true,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: { checkbox: true }
    };
    this.rowSelection = "multiple";
  },
  mounted() {
    this.$store.dispatch("loadFiles");
    this.gridOApi = this.gridOptions.api;
  },
  computed: {
    ...mapState(["rowData"])
  },
  methods: {
    onGridReady(params) {
      this.gridApi = params.api;
      this.columnApi = params.columnApi;
      params.api.sizeColumnsToFit();
      params.api.setRowData();
    },
    onRowSelected(event) {
      const selectedNodes = this.gridApi.getSelectedNodes();
      const selectedData = selectedNodes.map(node => node.data);
      const selectedDataStringPresentation = selectedData
        .map(node => node.name + " " + node.file_id)
        .join(", ");
      this.selectedDataSizes = selectedData.map(node => node.size);
      // get the total size
      const add = (a, b) => a + b;
      if (this.selectedDataSizes.length > 0) {
        this.status = true;
        const totalSize = { value: this.selectedDataSizes.reduce(add) };
        this.selectedDataTotal = sizeFormatter(totalSize);
      } else {
        this.status = false;
      }
    },
    submitFile() {
      if (this.selFile.size < 5 * 1024 * 1024) {
        var vm = this;
        const fd = new FormData();
        fd.append("file", vm.selFile);
        this.$store.dispatch("postFile", fd);
      } else {
        alert("O arquivo excede o tamanho máximo de 5MB");
      }
    },
    deleteFile() {
      const selectedNodes = this.gridApi.getSelectedNodes();
      if (selectedNodes.length > 0) {
        const selectedData = selectedNodes.map(node => node.data);
        const result_id = selectedData.map(node => node.id);
        this.result_id = result_id;
        this.mShow = true;
        this.modal = true;
      }
    },
    handleOk() {
      this.$store.dispatch("deleteFile", this.result_id);
      this.mShow = false;
      this.status = false;
    },
    onRowClicked(event) {

      let fileParams= {
        fileId: event.node.data.id,
        fileName: event.node.data.name
      };
      this.$store.dispatch("downloadFile", fileParams); 
    }
  }
};
</script>

<style lang="scss">
@import "../../node_modules/ag-grid-community/dist/styles/ag-grid.css";
@import "~ag-grid-community/dist/styles/ag-theme-material.css";
.ag-theme-material {
  font-size: 16px;
}
.ag-theme-material .ag-row,
.ag-theme-material .ag-row:not(.ag-row-first) {
  padding-top: 7px;
}
.ag-cell-focus,
.ag-cell-no-focus {
  border: none !important;
}
.ag-root-wrapper-body.ag-layout-normal {
  border-radius: 4px;
}
/* Style buttons */
.btn {
  margin-top: 20px;
  border: none; /* Remove borders */
  color: white; /* White text */
  padding: 12px 16px; /* Some padding */
  font-size: 16px; /* Set a font size */
  cursor: pointer; /* Mouse pointer on hover */
}
/* Darker background on mouse-over */
.btn:hover {
  background-color: Gray;
}
</style>
