import { useCallback, useEffect, useMemo, useState } from "react";
import AuthButton from "../AuthButton";
import { useAuth } from "../../auth/AuthContext";
import { authConfigured, supabase } from "../../auth/supabase";
import "./AccessMonitor.css";

const CAMPOS = "device_id,first_seen,last_seen,total_entries,total_sessions,active_days,entries_per_active_day,entries_per_session";
const CAMPOS_DIA = "access_day,unique_devices,total_entries,total_sessions,average_entries_per_device";
const CAMPOS_DISPOSITIVO_DIA = "access_day,device_id,entries,sessions,first_visit,last_visit";

function hojeSaoPaulo() {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
    return `${valores.year}-${valores.month}-${valores.day}`;
}

function diaAnterior(dia) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia || "")) return "";
    const data = new Date(`${dia}T12:00:00Z`);
    data.setUTCDate(data.getUTCDate() - 1);
    return data.toISOString().slice(0, 10);
}

function formatarData(valor) {
    if (!valor) return "—";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(data);
}

function formatarDia(valor) {
    if (!valor) return "—";
    const data = new Date(`${valor}T12:00:00Z`);
    if (Number.isNaN(data.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
    }).format(data);
}

function formatarNumero(valor, casas = 0) {
    const numero = Number(valor || 0);
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
    }).format(numero);
}

function formatarVariacao(valor) {
    if (valor === null || !Number.isFinite(valor)) return "Sem comparativo";
    const sinal = valor > 0 ? "+" : "";
    return `${sinal}${formatarNumero(valor, 1)}%`;
}

export default function AccessMonitor() {
    const { user, loading: authLoading } = useAuth();
    const [rows, setRows] = useState([]);
    const [dailyRows, setDailyRows] = useState([]);
    const [dailyDeviceRows, setDailyDeviceRows] = useState([]);
    const [selectedDay, setSelectedDay] = useState(hojeSaoPaulo);
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [updatedAt, setUpdatedAt] = useState(null);

    const carregar = useCallback(async () => {
        if (!user || !supabase) return;
        setLoading(true);
        setError("");

        const { data: autorizado, error: erroPermissao } = await supabase.rpc("is_access_monitor_admin");
        if (erroPermissao) {
            setIsAdmin(null);
            setRows([]);
            setDailyRows([]);
            setDailyDeviceRows([]);
            setError("Não foi possível validar o acesso. Confirme se a migração do painel foi aplicada no Supabase.");
            setLoading(false);
            return;
        }

        setIsAdmin(Boolean(autorizado));
        if (!autorizado) {
            setRows([]);
            setDailyRows([]);
            setDailyDeviceRows([]);
            setLoading(false);
            return;
        }

        const [resumoGeral, resumoDiario, dispositivosDoDia] = await Promise.all([
            supabase.from("access_monitor_summary")
                .select(CAMPOS)
                .order("last_seen", { ascending: false })
                .limit(1000),
            supabase.from("access_daily_summary")
                .select(CAMPOS_DIA)
                .order("access_day", { ascending: false })
                .limit(30),
            supabase.from("access_daily_device_summary")
                .select(CAMPOS_DISPOSITIVO_DIA)
                .eq("access_day", selectedDay)
                .order("entries", { ascending: false })
                .limit(1000),
        ]);

        const erroConsulta = resumoGeral.error || resumoDiario.error || dispositivosDoDia.error;
        if (erroConsulta) {
            setRows([]);
            setDailyRows([]);
            setDailyDeviceRows([]);
            setError("A consulta foi bloqueada. Verifique as migrações e as permissões do painel no Supabase.");
        } else {
            setRows(resumoGeral.data || []);
            setDailyRows(resumoDiario.data || []);
            setDailyDeviceRows(dispositivosDoDia.data || []);
            setUpdatedAt(new Date());
        }
        setLoading(false);
    }, [user, selectedDay]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const resumo = useMemo(() => {
        const agora = Date.now();
        const seteDias = 7 * 24 * 60 * 60 * 1000;
        return {
            devices: rows.length,
            entries: rows.reduce((total, row) => total + Number(row.total_entries || 0), 0),
            sessions: rows.reduce((total, row) => total + Number(row.total_sessions || 0), 0),
            active: rows.filter((row) => {
                const lastSeen = new Date(row.last_seen).getTime();
                return Number.isFinite(lastSeen) && agora - lastSeen <= seteDias;
            }).length,
        };
    }, [rows]);

    const resumoDia = useMemo(() => {
        const atual = dailyRows.find((row) => row.access_day === selectedDay);
        const anterior = dailyRows.find((row) => row.access_day === diaAnterior(selectedDay));
        const entradas = Number(atual?.total_entries || 0);
        const entradasAnteriores = Number(anterior?.total_entries || 0);
        const variacao = anterior && entradasAnteriores > 0
            ? ((entradas - entradasAnteriores) / entradasAnteriores) * 100
            : null;
        return {
            entries: entradas,
            devices: Number(atual?.unique_devices || 0),
            sessions: Number(atual?.total_sessions || 0),
            average: Number(atual?.average_entries_per_device || 0),
            variation: variacao,
        };
    }, [dailyRows, selectedDay]);

    return (
        <div className="access-monitor-page">
            <header className="access-monitor-topbar">
                <a href="/" className="access-monitor-brand">← Riff Theory</a>
                <span>Painel administrativo</span>
            </header>

            <main className="access-monitor-main">
                <p className="access-monitor-eyebrow">MÉTRICAS DE USO · DADOS PSEUDÔNIMOS</p>
                <div className="access-monitor-heading">
                    <div>
                        <h1>Monitor de acessos</h1>
                        <p>Entradas e frequência por navegador que aceitou o monitoramento.</p>
                    </div>
                    {user && (
                        <button className="access-monitor-refresh" type="button" onClick={carregar} disabled={loading}>
                            {loading ? "Atualizando…" : "Atualizar"}
                        </button>
                    )}
                </div>

                <div className="access-monitor-account"><AuthButton compact redirectTo={window.location.href} /></div>

                {!authLoading && !authConfigured && (
                    <section className="access-monitor-notice" role="status">
                        O login ainda não está configurado neste ambiente. O painel não libera dados sem autenticação.
                    </section>
                )}

                {!authLoading && authConfigured && !user && (
                    <section className="access-monitor-gate">
                        <h2>Acesso restrito</h2>
                        <p>Entre com a conta Google autorizada para consultar as métricas.</p>
                    </section>
                )}

                {user && error && <section className="access-monitor-error" role="alert">{error}</section>}

                {user && isAdmin === false && !loading && (
                    <section className="access-monitor-gate">
                        <h2>Conta sem autorização</h2>
                        <p>Esta conta não está na lista de administradores do monitor. Os dados continuam protegidos pelo Supabase.</p>
                    </section>
                )}

                {user && isAdmin && !error && (
                    <>
                        <section className="access-monitor-warning" role="note">
                            Os registros anteriores a 15/10/2026 às 13:58 (horário de Brasília) foram coletados antes da proteção
                            server-side e podem incluir chamadas falsificadas. O histórico foi preservado, mas use esses números
                            apenas como referência; os novos registros só voltam após a configuração do Turnstile.
                        </section>

                        <section className="access-monitor-daily">
                            <div className="access-monitor-daily-heading">
                                <div>
                                    <h2>Relatório diário</h2>
                                    <p>Contagem por dia em horário de Brasília; cada navegador aleatório conta como um navegador pseudônimo.</p>
                                </div>
                                <label className="access-monitor-date-filter">
                                    <span>Dia</span>
                                    <input
                                        type="date"
                                        value={selectedDay}
                                        max={hojeSaoPaulo()}
                                        onChange={(event) => setSelectedDay(event.target.value || hojeSaoPaulo())}
                                    />
                                </label>
                            </div>

                            <section className="access-monitor-metrics" aria-label="Resumo do dia selecionado">
                                <article><span>Acessos no dia</span><strong>{formatarNumero(resumoDia.entries)}</strong></article>
                                <article><span>Navegadores únicos</span><strong>{formatarNumero(resumoDia.devices)}</strong></article>
                                <article><span>Média de acessos por navegador</span><strong>{formatarNumero(resumoDia.average, 2)}</strong></article>
                                <article><span>Variação vs. dia anterior</span><strong>{formatarVariacao(resumoDia.variation)}</strong></article>
                            </section>

                            <section className="access-monitor-panel">
                                <div className="access-monitor-panel-heading">
                                    <div>
                                        <h3>Acessos por navegador em {formatarDia(selectedDay)}</h3>
                                        <p>Identificadores aleatórios; não correspondem necessariamente a pessoas ou contas Google.</p>
                                    </div>
                                    <small>{updatedAt ? `Atualizado ${formatarData(updatedAt)}` : ""}</small>
                                </div>
                                {loading && <p className="access-monitor-empty">Carregando métricas…</p>}
                                {!loading && dailyDeviceRows.length === 0 && <p className="access-monitor-empty">Nenhum acesso consentido neste dia.</p>}
                                {!loading && dailyDeviceRows.length > 0 && (
                                    <div className="access-monitor-table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Dispositivo pseudônimo</th>
                                                    <th>Acessos no dia</th>
                                                    <th>Sessões</th>
                                                    <th>Primeiro acesso</th>
                                                    <th>Último acesso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dailyDeviceRows.map((row) => (
                                                    <tr key={`${row.access_day}-${row.device_id}`}>
                                                        <td><code>…{String(row.device_id).slice(-8)}</code></td>
                                                        <td>{formatarNumero(row.entries)}</td>
                                                        <td>{formatarNumero(row.sessions)}</td>
                                                        <td>{formatarData(row.first_visit)}</td>
                                                        <td>{formatarData(row.last_visit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <section className="access-monitor-panel">
                                <div className="access-monitor-panel-heading">
                                    <div>
                                        <h3>Histórico diário · últimos 30 dias com registros</h3>
                                        <p>Os números são mantidos por dia, sem apagar contadores na virada da data.</p>
                                    </div>
                                </div>
                                {loading && <p className="access-monitor-empty">Carregando histórico…</p>}
                                {!loading && dailyRows.length === 0 && <p className="access-monitor-empty">Ainda não há dias com acessos consentidos.</p>}
                                {!loading && dailyRows.length > 0 && (
                                    <div className="access-monitor-table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Dia (Brasília)</th>
                                                    <th>Acessos</th>
                                                    <th>Navegadores únicos</th>
                                                    <th>Sessões</th>
                                                    <th>Média por navegador</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dailyRows.map((row) => (
                                                    <tr key={row.access_day}>
                                                        <td>{formatarDia(row.access_day)}</td>
                                                        <td>{formatarNumero(row.total_entries)}</td>
                                                        <td>{formatarNumero(row.unique_devices)}</td>
                                                        <td>{formatarNumero(row.total_sessions)}</td>
                                                        <td>{formatarNumero(row.average_entries_per_device, 2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </section>

                        <section className="access-monitor-metrics" aria-label="Resumo histórico">
                            <article><span>Navegadores registrados</span><strong>{formatarNumero(resumo.devices)}</strong></article>
                            <article><span>Entradas históricas</span><strong>{formatarNumero(resumo.entries)}</strong></article>
                            <article><span>Sessões históricas</span><strong>{formatarNumero(resumo.sessions)}</strong></article>
                            <article><span>Ativos nos últimos 7 dias</span><strong>{formatarNumero(resumo.active)}</strong></article>
                        </section>

                        <section className="access-monitor-panel">
                            <div className="access-monitor-panel-heading">
                                <div>
                                    <h2>Frequência histórica por navegador</h2>
                                    <p>O identificador aleatório é guardado neste navegador e assinado no servidor; não é um nome nem um IP.</p>
                                </div>
                            </div>
                            {loading && <p className="access-monitor-empty">Carregando métricas…</p>}
                            {!loading && rows.length === 0 && <p className="access-monitor-empty">Ainda não há acessos consentidos registrados.</p>}
                            {!loading && rows.length > 0 && (
                                <div className="access-monitor-table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Dispositivo pseudônimo</th>
                                                <th>Primeiro acesso</th>
                                                <th>Último acesso</th>
                                                <th>Entradas</th>
                                                <th>Sessões</th>
                                                <th>Dias ativos</th>
                                                <th>Entradas/dia ativo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => (
                                                <tr key={row.device_id}>
                                                    <td><code>…{String(row.device_id).slice(-8)}</code></td>
                                                    <td>{formatarData(row.first_seen)}</td>
                                                    <td>{formatarData(row.last_seen)}</td>
                                                    <td>{formatarNumero(row.total_entries)}</td>
                                                    <td>{formatarNumero(row.total_sessions)}</td>
                                                    <td>{formatarNumero(row.active_days)}</td>
                                                    <td>{formatarNumero(row.entries_per_active_day, 2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                        <p className="access-monitor-footnote">
                            A contagem depende de consentimento e do armazenamento local. Se alguém apagar os dados do navegador ou trocar de navegador/dispositivo, poderá aparecer como outro identificador. O monitor não tenta identificar pessoas nem usa IP para criar ou limitar esses registros.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}
