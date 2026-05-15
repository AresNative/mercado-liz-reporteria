import Footer from "@/template/footer";
import Header from "@/template/header";
import { formatValue } from "@/utils/constants/format-values";
import { GitCompare, Loader2 } from "lucide-react";

export default function Analisis() {



  return (
    <>
          <Header />
          <section className="p-3 md:p-4 min-h-[70vh]">
             {/*  <ul className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                  <li className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <GitCompare className="h-4 w-4 text-indigo-500" />
                      <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                          Comparativa del período
                      </span>
                      {loading && (
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-400 ml-1" />
                      )}
                  </li>

                  <li className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">

                      <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Ventas</span>
                          </div>
                          <dl className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Total vendido</dt>
                                  <dd className="font-medium text-green-600 dark:text-green-400">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(comparisonStats.ventas.totalVentas ?? 0, "currency")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Costo de venta</dt>
                                  <dd className="font-medium text-gray-700 dark:text-gray-300">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.ventas as any).totalCostoVentas ?? 0, "currency")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Tickets</dt>
                                  <dd className="font-medium text-gray-700 dark:text-gray-300">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(comparisonStats.ventas.totalTikets ?? 0, "number")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Artículos distintos</dt>
                                  <dd className="font-medium text-gray-700 dark:text-gray-300">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.ventas as any).totalArticulosVendidos ?? 0, "number")}
                                  </dd>
                              </div>
                          </dl>
                      </div>

                      <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Compras</span>
                          </div>
                          <dl className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Total comprado</dt>
                                  <dd className="font-medium text-blue-600 dark:text-blue-400">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.compras as any).totalCompras ?? 0, "currency")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Proveedores</dt>
                                  <dd className="font-medium text-gray-700 dark:text-gray-300">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(comparisonStats.compras.totalProveedores ?? 0, "number")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Artículos distintos</dt>
                                  <dd className="font-medium text-gray-700 dark:text-gray-300">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.compras as any).totalArticulosComprados ?? 0, "number")}
                                  </dd>
                              </div>
                          </dl>
                      </div>

                      <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mermas</span>
                          </div>
                          <dl className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Total merma</dt>
                                  <dd className="font-medium text-orange-600 dark:text-orange-400">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.mermas as any).totalMermas ?? 0, "currency")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400">Artículos afectados</dt>
                                  <dd className="font-medium text-gray-700 dark:text-gray-300">
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.mermas as any).totalArticulosMerma ?? 0, "number")}
                                  </dd>
                              </div>
                          </dl>

                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Utilidad bruta</dt>
                                  <dd className={`font-bold ${(stats.utilidad ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(stats.utilidad ?? 0, "currency")}
                                  </dd>
                              </div>
                              <div className="flex justify-between">
                                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Margen</dt>
                                  <dd className={`font-bold ${(stats.margen ?? 0) >= 20 ? "text-green-600 dark:text-green-400" : (stats.margen ?? 0) >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(stats.margen ?? 0, "percentage")}
                                  </dd>
                              </div>
                          </div>
                      </div>
                  </li>
              </ul> */}
          </section>
          <Footer />
    </>
  );
}